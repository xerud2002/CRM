import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  Lead,
  LeadStatus,
  LeadSource,
  ContactStatus,
  Quote,
  QuoteStatus,
  Call,
  CallStatus,
  Email,
  Assessment,
  AssessmentStatus,
} from '../entities';
import { ReportFilterDto, ReportPeriod } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
  ) {}

  private getDateRange(filter: ReportFilterDto): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter.period) {
      case ReportPeriod.TODAY:
        return { start: today, end: now };
      
      case ReportPeriod.YESTERDAY:
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      
      case ReportPeriod.THIS_WEEK:
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
        return { start: weekStart, end: now };
      
      case ReportPeriod.LAST_WEEK:
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay()); // Last Sunday
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        return { start: lastWeekStart, end: lastWeekEnd };
      
      case ReportPeriod.THIS_MONTH:
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
      
      case ReportPeriod.LAST_MONTH:
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: lastMonthStart, end: lastMonthEnd };
      
      case ReportPeriod.THIS_QUARTER:
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        return { start: quarterStart, end: now };
      
      case ReportPeriod.THIS_YEAR:
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      
      case ReportPeriod.CUSTOM:
      default:
        return {
          start: filter.dateFrom ? new Date(filter.dateFrom) : new Date(now.getFullYear(), 0, 1),
          end: filter.dateTo ? new Date(filter.dateTo) : now,
        };
    }
  }

  async getLeadsBySource(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);
    
    const result = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COUNT(CASE WHEN lead.status = :won THEN 1 END)', 'won')
      .addSelect('COUNT(CASE WHEN lead.status = :lost THEN 1 END)', 'lost')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: [LeadStatus.PENDING, LeadStatus.REJECTED],
      })
      .setParameter('won', LeadStatus.WON)
      .setParameter('lost', LeadStatus.LOST)
      .groupBy('lead.source')
      .getRawMany();

    return result.map((r) => ({
      source: r.source,
      count: parseInt(r.count, 10),
      won: parseInt(r.won, 10),
      lost: parseInt(r.lost, 10),
      conversionRate: parseInt(r.count, 10) > 0 
        ? Math.round((parseInt(r.won, 10) / parseInt(r.count, 10)) * 1000) / 10 
        : 0,
    }));
  }

  async getLeadsByStatus(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);
    
    const result = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: [LeadStatus.PENDING, LeadStatus.REJECTED],
      })
      .groupBy('lead.status')
      .getRawMany();

    return result.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  async getLeadsTrend(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);
    
    // Determine grouping based on date range
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    let dateFormat = 'YYYY-MM-DD';
    let groupBy = 'day';
    
    if (diffDays > 90) {
      dateFormat = 'YYYY-MM';
      groupBy = 'month';
    } else if (diffDays > 31) {
      dateFormat = 'IYYY-IW';
      groupBy = 'week';
    }

    const result = await this.leadRepository
      .createQueryBuilder('lead')
      .select(`TO_CHAR(lead.createdAt, '${dateFormat}')`, 'period')
      .addSelect('COUNT(*)', 'total')
      .addSelect('COUNT(CASE WHEN lead.status = :won THEN 1 END)', 'won')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: [LeadStatus.PENDING, LeadStatus.REJECTED],
      })
      .setParameter('won', LeadStatus.WON)
      .groupBy(`TO_CHAR(lead.createdAt, '${dateFormat}')`)
      .orderBy(`TO_CHAR(lead.createdAt, '${dateFormat}')`, 'ASC')
      .getRawMany();

    return {
      groupBy,
      data: result.map((r) => ({
        period: r.period,
        total: parseInt(r.total, 10),
        won: parseInt(r.won, 10),
      })),
    };
  }

  async getRevenueReport(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);

    // Quotes accepted in period
    const acceptedQuotes = await this.quoteRepository
      .createQueryBuilder('quote')
      .select('SUM(quote.total)', 'totalValue')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(quote.total)', 'averageValue')
      .where('quote.status = :status', { status: QuoteStatus.ACCEPTED })
      .andWhere('quote.updatedAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // Quotes sent in period
    const sentQuotes = await this.quoteRepository
      .createQueryBuilder('quote')
      .select('SUM(quote.total)', 'totalValue')
      .addSelect('COUNT(*)', 'count')
      .where('quote.status IN (:...statuses)', { 
        statuses: [QuoteStatus.SENT, QuoteStatus.VIEWED, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED] 
      })
      .andWhere('quote.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // Revenue trend by month
    const revenueTrend = await this.quoteRepository
      .createQueryBuilder('quote')
      .select("TO_CHAR(quote.updatedAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(quote.total)', 'revenue')
      .addSelect('COUNT(*)', 'count')
      .where('quote.status = :status', { status: QuoteStatus.ACCEPTED })
      .andWhere('quote.updatedAt BETWEEN :start AND :end', { start, end })
      .groupBy("TO_CHAR(quote.updatedAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(quote.updatedAt, 'YYYY-MM')", 'ASC')
      .getRawMany();

    return {
      accepted: {
        totalValue: parseFloat(acceptedQuotes?.totalValue || '0'),
        count: parseInt(acceptedQuotes?.count || '0', 10),
        averageValue: parseFloat(acceptedQuotes?.averageValue || '0'),
      },
      sent: {
        totalValue: parseFloat(sentQuotes?.totalValue || '0'),
        count: parseInt(sentQuotes?.count || '0', 10),
      },
      conversionRate: parseInt(sentQuotes?.count || '0', 10) > 0
        ? Math.round((parseInt(acceptedQuotes?.count || '0', 10) / parseInt(sentQuotes?.count || '0', 10)) * 1000) / 10
        : 0,
      trend: revenueTrend.map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue || '0'),
        count: parseInt(r.count, 10),
      })),
    };
  }

  async getActivityReport(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);

    // Calls
    const callStats = await this.callRepository
      .createQueryBuilder('call')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(CASE WHEN call.status = :answered THEN 1 END)', 'answered')
      .addSelect('COUNT(CASE WHEN call.direction = :outbound THEN 1 END)', 'outbound')
      .addSelect('COUNT(CASE WHEN call.direction = :inbound THEN 1 END)', 'inbound')
      .addSelect('AVG(CASE WHEN call.durationSeconds > 0 THEN call.durationSeconds END)', 'avgDuration')
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .setParameter('answered', CallStatus.ANSWERED)
      .setParameter('outbound', 'outbound')
      .setParameter('inbound', 'inbound')
      .getRawOne();

    // Emails
    const emailStats = await this.emailRepository
      .createQueryBuilder('email')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(CASE WHEN email.direction = :outbound THEN 1 END)', 'sent')
      .addSelect('COUNT(CASE WHEN email.direction = :inbound THEN 1 END)', 'received')
      .where('email.createdAt BETWEEN :start AND :end', { start, end })
      .setParameter('outbound', 'outbound')
      .setParameter('inbound', 'inbound')
      .getRawOne();

    // Assessments
    const assessmentStats = await this.assessmentRepository
      .createQueryBuilder('assessment')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(CASE WHEN assessment.status = :completed THEN 1 END)', 'completed')
      .addSelect('COUNT(CASE WHEN assessment.status = :cancelled THEN 1 END)', 'cancelled')
      .addSelect('COUNT(CASE WHEN assessment.type = :video THEN 1 END)', 'video')
      .addSelect('COUNT(CASE WHEN assessment.type = :onSite THEN 1 END)', 'onSite')
      .where('assessment.scheduledAt BETWEEN :start AND :end', { start, end })
      .setParameter('completed', AssessmentStatus.COMPLETED)
      .setParameter('cancelled', AssessmentStatus.CANCELLED)
      .setParameter('video', 'video')
      .setParameter('onSite', 'on_site')
      .getRawOne();

    return {
      calls: {
        total: parseInt(callStats?.total || '0', 10),
        answered: parseInt(callStats?.answered || '0', 10),
        outbound: parseInt(callStats?.outbound || '0', 10),
        inbound: parseInt(callStats?.inbound || '0', 10),
        avgDurationSeconds: parseFloat(callStats?.avgDuration || '0'),
        answerRate: parseInt(callStats?.total || '0', 10) > 0
          ? Math.round((parseInt(callStats?.answered || '0', 10) / parseInt(callStats?.total || '0', 10)) * 1000) / 10
          : 0,
      },
      emails: {
        total: parseInt(emailStats?.total || '0', 10),
        sent: parseInt(emailStats?.sent || '0', 10),
        received: parseInt(emailStats?.received || '0', 10),
      },
      assessments: {
        total: parseInt(assessmentStats?.total || '0', 10),
        completed: parseInt(assessmentStats?.completed || '0', 10),
        cancelled: parseInt(assessmentStats?.cancelled || '0', 10),
        video: parseInt(assessmentStats?.video || '0', 10),
        onSite: parseInt(assessmentStats?.onSite || '0', 10),
        completionRate: parseInt(assessmentStats?.total || '0', 10) > 0
          ? Math.round((parseInt(assessmentStats?.completed || '0', 10) / parseInt(assessmentStats?.total || '0', 10)) * 1000) / 10
          : 0,
      },
    };
  }

  async getConversionFunnel(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);

    const totalLeads = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: [LeadStatus.PENDING, LeadStatus.REJECTED],
      })
      .getCount();

    const contacted = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.contactStatus IN (:...statuses)', {
        statuses: [ContactStatus.CONTACTED, ContactStatus.RESPONDED, ContactStatus.NO_RESPONSE],
      })
      .getCount();

    const responded = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.contactStatus = :status', { status: ContactStatus.RESPONDED })
      .getCount();

    const assessmentBooked = await this.assessmentRepository
      .createQueryBuilder('assessment')
      .innerJoin('assessment.lead', 'lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .select('COUNT(DISTINCT assessment.leadId)', 'count')
      .getRawOne()
      .then((r) => parseInt(r?.count || '0', 10));

    const assessmentCompleted = await this.assessmentRepository
      .createQueryBuilder('assessment')
      .innerJoin('assessment.lead', 'lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('assessment.status = :status', { status: AssessmentStatus.COMPLETED })
      .select('COUNT(DISTINCT assessment.leadId)', 'count')
      .getRawOne()
      .then((r) => parseInt(r?.count || '0', 10));

    const quoteSent = await this.quoteRepository
      .createQueryBuilder('quote')
      .innerJoin('quote.lead', 'lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('quote.status IN (:...statuses)', {
        statuses: [QuoteStatus.SENT, QuoteStatus.VIEWED, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED],
      })
      .select('COUNT(DISTINCT quote.leadId)', 'count')
      .getRawOne()
      .then((r) => parseInt(r?.count || '0', 10));

    const quoteAccepted = await this.quoteRepository
      .createQueryBuilder('quote')
      .innerJoin('quote.lead', 'lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('quote.status = :status', { status: QuoteStatus.ACCEPTED })
      .select('COUNT(DISTINCT quote.leadId)', 'count')
      .getRawOne()
      .then((r) => parseInt(r?.count || '0', 10));

    const won = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status = :status', { status: LeadStatus.WON })
      .getCount();

    return {
      stages: [
        { name: 'New Leads', count: totalLeads, percent: 100 },
        { name: 'Contacted', count: contacted, percent: totalLeads > 0 ? Math.round((contacted / totalLeads) * 1000) / 10 : 0 },
        { name: 'Responded', count: responded, percent: totalLeads > 0 ? Math.round((responded / totalLeads) * 1000) / 10 : 0 },
        { name: 'Assessment Booked', count: assessmentBooked, percent: totalLeads > 0 ? Math.round((assessmentBooked / totalLeads) * 1000) / 10 : 0 },
        { name: 'Assessment Done', count: assessmentCompleted, percent: totalLeads > 0 ? Math.round((assessmentCompleted / totalLeads) * 1000) / 10 : 0 },
        { name: 'Quote Sent', count: quoteSent, percent: totalLeads > 0 ? Math.round((quoteSent / totalLeads) * 1000) / 10 : 0 },
        { name: 'Quote Accepted', count: quoteAccepted, percent: totalLeads > 0 ? Math.round((quoteAccepted / totalLeads) * 1000) / 10 : 0 },
        { name: 'Won', count: won, percent: totalLeads > 0 ? Math.round((won / totalLeads) * 1000) / 10 : 0 },
      ],
      overallConversion: totalLeads > 0 ? Math.round((won / totalLeads) * 1000) / 10 : 0,
    };
  }

  async getStaffPerformance(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);

    const result = await this.leadRepository
      .createQueryBuilder('lead')
      .leftJoin('lead.assignedTo', 'user')
      .select('user.id', 'userId')
      .addSelect('user.name', 'name')
      .addSelect('COUNT(*)', 'totalLeads')
      .addSelect('COUNT(CASE WHEN lead.status = :won THEN 1 END)', 'won')
      .addSelect('COUNT(CASE WHEN lead.status = :lost THEN 1 END)', 'lost')
      .addSelect('COUNT(CASE WHEN lead.contactStatus IN (:...contactedStatuses) THEN 1 END)', 'contacted')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: [LeadStatus.PENDING, LeadStatus.REJECTED],
      })
      .andWhere('lead.assignedToId IS NOT NULL')
      .setParameter('won', LeadStatus.WON)
      .setParameter('lost', LeadStatus.LOST)
      .setParameter('contactedStatuses', [ContactStatus.CONTACTED, ContactStatus.RESPONDED, ContactStatus.NO_RESPONSE])
      .groupBy('user.id')
      .addGroupBy('user.name')
      .getRawMany();

    // Get call counts per user
    const callCounts = await this.callRepository
      .createQueryBuilder('call')
      .leftJoin('call.user', 'user')
      .select('user.id', 'userId')
      .addSelect('COUNT(*)', 'callCount')
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('user.id')
      .getRawMany();

    const callMap = new Map(callCounts.map((c) => [c.userId, parseInt(c.callCount, 10)]));

    return result.map((r) => ({
      userId: r.userId,
      name: r.name || 'Unassigned',
      totalLeads: parseInt(r.totalLeads, 10),
      won: parseInt(r.won, 10),
      lost: parseInt(r.lost, 10),
      contacted: parseInt(r.contacted, 10),
      calls: callMap.get(r.userId) || 0,
      conversionRate: parseInt(r.totalLeads, 10) > 0
        ? Math.round((parseInt(r.won, 10) / parseInt(r.totalLeads, 10)) * 1000) / 10
        : 0,
    }));
  }

  async getLocationAnalysis(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);

    // Group by postcode prefix (first 2-3 chars)
    const result = await this.leadRepository
      .createQueryBuilder('lead')
      .select("UPPER(SUBSTRING(lead.fromPostcode FROM 1 FOR 2))", 'postcodeArea')
      .addSelect('COUNT(*)', 'total')
      .addSelect('COUNT(CASE WHEN lead.status = :won THEN 1 END)', 'won')
      .addSelect('AVG(lead.quoteAmount)', 'avgQuoteValue')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: [LeadStatus.PENDING, LeadStatus.REJECTED],
      })
      .andWhere('lead.fromPostcode IS NOT NULL')
      .setParameter('won', LeadStatus.WON)
      .groupBy("UPPER(SUBSTRING(lead.fromPostcode FROM 1 FOR 2))")
      .orderBy('COUNT(*)', 'DESC')
      .limit(20)
      .getRawMany();

    return result.map((r) => ({
      postcodeArea: r.postcodeArea,
      total: parseInt(r.total, 10),
      won: parseInt(r.won, 10),
      avgQuoteValue: parseFloat(r.avgQuoteValue || '0'),
      conversionRate: parseInt(r.total, 10) > 0
        ? Math.round((parseInt(r.won, 10) / parseInt(r.total, 10)) * 1000) / 10
        : 0,
    }));
  }

  async getSummary(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter);

    const [leadsBySource, revenue, activity, funnel] = await Promise.all([
      this.getLeadsBySource(filter),
      this.getRevenueReport(filter),
      this.getActivityReport(filter),
      this.getConversionFunnel(filter),
    ]);

    const totalLeads = leadsBySource.reduce((sum, s) => sum + s.count, 0);
    const totalWon = leadsBySource.reduce((sum, s) => sum + s.won, 0);

    return {
      period: { start, end },
      summary: {
        totalLeads,
        totalWon,
        conversionRate: totalLeads > 0 ? Math.round((totalWon / totalLeads) * 1000) / 10 : 0,
        revenue: revenue.accepted.totalValue,
        avgDealValue: revenue.accepted.averageValue,
        quotesSent: revenue.sent.count,
        quotesAccepted: revenue.accepted.count,
        totalCalls: activity.calls.total,
        totalEmails: activity.emails.total,
        assessments: activity.assessments.total,
      },
      leadsBySource,
      funnel: funnel.stages,
    };
  }
}
