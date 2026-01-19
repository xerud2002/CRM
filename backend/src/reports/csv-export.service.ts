import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Lead, LeadStatus, Quote, Call, Assessment } from '../entities';
import { ReportFilterDto, ReportPeriod } from './dto/report-filter.dto';

@Injectable()
export class CsvExportService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
  ) {}

  private getDateRange(filter: ReportFilterDto): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter.period) {
      case ReportPeriod.TODAY:
        return { start: today, end: now };
      case ReportPeriod.THIS_WEEK: {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        return { start: weekStart, end: now };
      }
      case ReportPeriod.THIS_MONTH: {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
      }
      case ReportPeriod.THIS_QUARTER: {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
        return { start: quarterStart, end: now };
      }
      case ReportPeriod.THIS_YEAR: {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      }
      case ReportPeriod.CUSTOM:
        if (filter.dateFrom && filter.dateTo) {
          return {
            start: new Date(filter.dateFrom),
            end: new Date(filter.dateTo),
          };
        }
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
    }
  }

  private escapeCsvField(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private arrayToCsv(headers: string[], rows: any[][]): string {
    const headerLine = headers.map((h) => this.escapeCsvField(h)).join(',');
    const dataLines = rows.map((row) =>
      row.map((cell) => this.escapeCsvField(cell)).join(','),
    );
    return [headerLine, ...dataLines].join('\n');
  }

  async exportLeads(filter: ReportFilterDto): Promise<string> {
    const { start, end } = this.getDateRange(filter);

    const queryBuilder = this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedTo', 'assignedTo')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('lead.status != :pending', { pending: LeadStatus.PENDING });

    if (filter.source) {
      queryBuilder.andWhere('lead.source = :source', { source: filter.source });
    }

    if (filter.postcodes && filter.postcodes.length > 0) {
      const postcodeConditions = filter.postcodes.map((pc, i) => {
        queryBuilder.setParameter(`pc${i}`, `${pc}%`);
        return `(lead.fromPostcode ILIKE :pc${i} OR lead.toPostcode ILIKE :pc${i})`;
      });
      queryBuilder.andWhere(`(${postcodeConditions.join(' OR ')})`);
    }

    queryBuilder.orderBy('lead.createdAt', 'DESC');

    const leads = await queryBuilder.getMany();

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Contact Status',
      'Source',
      'From Postcode',
      'To Postcode',
      'Move Date',
      'Bedrooms',
      'Assigned To',
      'Created At',
    ];

    const rows = leads.map((lead) => [
      lead.id,
      `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
      lead.email,
      lead.phone,
      lead.status,
      lead.contactStatus,
      lead.source,
      lead.fromPostcode,
      lead.toPostcode,
      lead.moveDate ? new Date(lead.moveDate).toISOString().split('T')[0] : '',
      lead.bedrooms,
      lead.assignedTo?.name || '',
      new Date(lead.createdAt).toISOString(),
    ]);

    return this.arrayToCsv(headers, rows);
  }

  async exportQuotes(filter: ReportFilterDto): Promise<string> {
    const { start, end } = this.getDateRange(filter);

    const quotes = await this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.lead', 'lead')
      .where('quote.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('quote.createdAt', 'DESC')
      .getMany();

    const headers = [
      'Quote Number',
      'Lead Name',
      'Lead Email',
      'Status',
      'Subtotal',
      'VAT',
      'Total',
      'Move Date',
      'Valid Until',
      'Created At',
    ];

    const rows = quotes.map((quote) => [
      quote.quoteNumber,
      quote.lead
        ? `${quote.lead.firstName || ''} ${quote.lead.lastName || ''}`.trim()
        : '',
      quote.lead?.email || '',
      quote.status,
      quote.subtotal,
      quote.vatAmount,
      quote.total,
      quote.moveDate
        ? new Date(quote.moveDate).toISOString().split('T')[0]
        : '',
      quote.validUntil
        ? new Date(quote.validUntil).toISOString().split('T')[0]
        : '',
      new Date(quote.createdAt).toISOString(),
    ]);

    return this.arrayToCsv(headers, rows);
  }

  async exportCalls(filter: ReportFilterDto): Promise<string> {
    const { start, end } = this.getDateRange(filter);

    const calls = await this.callRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.lead', 'lead')
      .leftJoinAndSelect('call.user', 'user')
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('call.createdAt', 'DESC')
      .getMany();

    const headers = [
      'ID',
      'Lead Name',
      'Lead Phone',
      'Direction',
      'Status',
      'Duration (sec)',
      'Notes',
      'Called By',
      'Created At',
    ];

    const rows = calls.map((call) => [
      call.id,
      call.lead
        ? `${call.lead.firstName || ''} ${call.lead.lastName || ''}`.trim()
        : '',
      call.lead?.phone || '',
      call.direction,
      call.status,
      call.durationSeconds || 0,
      call.notes || '',
      call.user?.name || '',
      new Date(call.createdAt).toISOString(),
    ]);

    return this.arrayToCsv(headers, rows);
  }

  async exportAssessments(filter: ReportFilterDto): Promise<string> {
    const { start, end } = this.getDateRange(filter);

    const assessments = await this.assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.lead', 'lead')
      .leftJoinAndSelect('assessment.assignedTo', 'assignedTo')
      .where('assessment.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('assessment.assessmentDate', 'DESC')
      .getMany();

    const headers = [
      'ID',
      'Lead Name',
      'Lead Email',
      'Type',
      'Method',
      'Date',
      'Time',
      'Status',
      'From Postcode',
      'To Postcode',
      'Assigned To',
      'Notes',
      'Outcome',
    ];

    const rows = assessments.map((a) => [
      a.id,
      a.lead ? `${a.lead.firstName || ''} ${a.lead.lastName || ''}`.trim() : '',
      a.lead?.email || '',
      a.type,
      a.method,
      a.assessmentDate
        ? new Date(a.assessmentDate).toISOString().split('T')[0]
        : '',
      a.assessmentTime || '',
      a.status,
      a.fromPostcode || '',
      a.toPostcode || '',
      a.assignedTo?.name || '',
      a.notes || '',
      a.outcome || '',
    ]);

    return this.arrayToCsv(headers, rows);
  }

  async exportSummary(filter: ReportFilterDto): Promise<string> {
    const { start, end } = this.getDateRange(filter);

    // Aggregate metrics
    const [totalLeads, wonLeads, lostLeads, callsCount, assessmentsCount] =
      await Promise.all([
        this.leadRepository.count({
          where: { createdAt: Between(start, end) },
        }),
        this.leadRepository.count({
          where: { createdAt: Between(start, end), status: LeadStatus.WON },
        }),
        this.leadRepository.count({
          where: { createdAt: Between(start, end), status: LeadStatus.LOST },
        }),
        this.callRepository.count({
          where: { createdAt: Between(start, end) },
        }),
        this.assessmentRepository.count({
          where: { createdAt: Between(start, end) },
        }),
      ]);

    // Get quotes data separately for type safety
    const quotesData: { count: string; total: string | null } | undefined =
      await this.quoteRepository
        .createQueryBuilder('quote')
        .select('COUNT(*)', 'count')
        .addSelect('SUM(quote.total)', 'total')
        .where('quote.createdAt BETWEEN :start AND :end', { start, end })
        .getRawOne();

    const quotesCount = parseInt(quotesData?.count || '0', 10);
    const quotesTotal = parseFloat(quotesData?.total || '0');

    const headers = ['Metric', 'Value'];
    const rows = [
      [
        'Report Period',
        `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
      ],
      ['Total Leads', totalLeads],
      ['Won Leads', wonLeads],
      ['Lost Leads', lostLeads],
      [
        'Conversion Rate',
        totalLeads > 0
          ? `${((wonLeads / totalLeads) * 100).toFixed(1)}%`
          : '0%',
      ],
      ['Total Quotes', quotesCount],
      ['Quote Revenue', `£${quotesTotal.toFixed(2)}`],
      ['Total Calls', callsCount],
      ['Total Assessments', assessmentsCount],
    ];

    return this.arrayToCsv(headers, rows);
  }
}
