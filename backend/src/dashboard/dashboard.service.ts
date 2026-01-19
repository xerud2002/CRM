import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { Lead, LeadStatus, ContactStatus, Activity, Email, Call, Assessment, AssessmentStatus } from '../entities';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

export interface ContactMetrics {
    totalLeads: number;
    contacted: number;
    contactedPercent: number;
    responded: number;
    respondedPercent: number;
    noResponse: number;
    noResponsePercent: number;
}

export interface MethodBreakdown {
    emailsSent: number;
    emailsResponded: number;
    emailResponseRate: number;
    callsMade: number;
    callsAnswered: number;
    callAnswerRate: number;
}

export interface ConversionFunnel {
    totalLeads: number;
    surveyBooked: number;
    surveyBookedPercent: number;
    surveyCompleted: number;
    surveyCompletedPercent: number;
    quoteSent: number;
    quoteSentPercent: number;
    quoteAccepted: number;
    quoteAcceptedPercent: number;
}

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Lead)
        private readonly leadRepository: Repository<Lead>,
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
        @InjectRepository(Email)
        private readonly emailRepository: Repository<Email>,
        @InjectRepository(Call)
        private readonly callRepository: Repository<Call>,
        @InjectRepository(Assessment)
        private readonly assessmentRepository: Repository<Assessment>,
    ) { }

    async getOverview(filter: DashboardFilterDto) {
        const contactMetrics = await this.getContactMetrics(filter);
        const methodBreakdown = await this.getMethodBreakdown(filter);
        const conversionFunnel = await this.getConversionFunnel(filter);

        return {
            contactMetrics,
            methodBreakdown,
            conversionFunnel,
        };
    }

    async getContactMetrics(filter: DashboardFilterDto): Promise<ContactMetrics> {
        const query = this.leadRepository.createQueryBuilder('lead');
        this.applyFilters(query, filter);

        const totalLeads = await query.getCount();

        const contacted = await query
            .clone()
            .andWhere('lead.contactStatus IN (:...statuses)', {
                statuses: [ContactStatus.CONTACTED, ContactStatus.RESPONDED, ContactStatus.NO_RESPONSE],
            })
            .getCount();

        const responded = await query
            .clone()
            .andWhere('lead.contactStatus = :status', { status: ContactStatus.RESPONDED })
            .getCount();

        const noResponse = await query
            .clone()
            .andWhere('lead.contactStatus = :status', { status: ContactStatus.NO_RESPONSE })
            .getCount();

        return {
            totalLeads,
            contacted,
            contactedPercent: totalLeads > 0 ? Math.round((contacted / totalLeads) * 1000) / 10 : 0,
            responded,
            respondedPercent: contacted > 0 ? Math.round((responded / contacted) * 1000) / 10 : 0,
            noResponse,
            noResponsePercent: contacted > 0 ? Math.round((noResponse / contacted) * 1000) / 10 : 0,
        };
    }

    async getMethodBreakdown(filter: DashboardFilterDto): Promise<MethodBreakdown> {
        const emailQuery = this.emailRepository.createQueryBuilder('email');
        const callQuery = this.callRepository.createQueryBuilder('call');

        // Apply date filters
        if (filter.dateFrom) {
            emailQuery.andWhere('email.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
            callQuery.andWhere('call.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
        }
        if (filter.dateTo) {
            emailQuery.andWhere('email.createdAt <= :dateTo', { dateTo: filter.dateTo });
            callQuery.andWhere('call.createdAt <= :dateTo', { dateTo: filter.dateTo });
        }

        const emailsSent = await emailQuery
            .clone()
            .andWhere('email.direction = :direction', { direction: 'outbound' })
            .getCount();

        const emailsResponded = await emailQuery
            .clone()
            .andWhere('email.direction = :direction', { direction: 'inbound' })
            .getCount();

        const callsMade = await callQuery.clone().getCount();

        const callsAnswered = await callQuery
            .clone()
            .andWhere('call.answered = :answered', { answered: true })
            .getCount();

        return {
            emailsSent,
            emailsResponded,
            emailResponseRate: emailsSent > 0 ? Math.round((emailsResponded / emailsSent) * 1000) / 10 : 0,
            callsMade,
            callsAnswered,
            callAnswerRate: callsMade > 0 ? Math.round((callsAnswered / callsMade) * 1000) / 10 : 0,
        };
    }

    async getConversionFunnel(filter: DashboardFilterDto): Promise<ConversionFunnel> {
        const leadQuery = this.leadRepository.createQueryBuilder('lead');
        this.applyFilters(leadQuery, filter);

        const totalLeads = await leadQuery.getCount();

        // Leads with at least one assessment booked
        const surveyBooked = await this.assessmentRepository
            .createQueryBuilder('assessment')
            .select('COUNT(DISTINCT assessment.leadId)', 'count')
            .getRawOne()
            .then((r) => parseInt(r.count, 10));

        // Leads with completed assessment
        const surveyCompleted = await this.assessmentRepository
            .createQueryBuilder('assessment')
            .select('COUNT(DISTINCT assessment.leadId)', 'count')
            .where('assessment.status = :status', { status: AssessmentStatus.COMPLETED })
            .getRawOne()
            .then((r) => parseInt(r.count, 10));

        // Leads with quote amount set
        const quoteSent = await leadQuery
            .clone()
            .andWhere('lead.quoteAmount IS NOT NULL')
            .getCount();

        // Leads with quote accepted
        const quoteAccepted = await leadQuery
            .clone()
            .andWhere('lead.quoteAccepted = :accepted', { accepted: true })
            .getCount();

        return {
            totalLeads,
            surveyBooked,
            surveyBookedPercent: totalLeads > 0 ? Math.round((surveyBooked / totalLeads) * 1000) / 10 : 0,
            surveyCompleted,
            surveyCompletedPercent: surveyBooked > 0 ? Math.round((surveyCompleted / surveyBooked) * 1000) / 10 : 0,
            quoteSent,
            quoteSentPercent: surveyCompleted > 0 ? Math.round((quoteSent / surveyCompleted) * 1000) / 10 : 0,
            quoteAccepted,
            quoteAcceptedPercent: quoteSent > 0 ? Math.round((quoteAccepted / quoteSent) * 1000) / 10 : 0,
        };
    }

    async getByLocation(filter: DashboardFilterDto) {
        if (!filter.postcodes || filter.postcodes.length === 0) {
            return { error: 'Please provide at least one postcode' };
        }

        const metrics = await this.getContactMetrics(filter);
        const funnel = await this.getConversionFunnel(filter);

        return {
            postcodes: filter.postcodes,
            ...metrics,
            surveyBooked: funnel.surveyBooked,
            quoteAccepted: funnel.quoteAccepted,
        };
    }

    private applyFilters(query: any, filter: DashboardFilterDto) {
        // Exclude pending and rejected
        query.andWhere('lead.status NOT IN (:...excludeStatuses)', {
            excludeStatuses: [LeadStatus.PENDING, LeadStatus.REJECTED],
        });

        // Postcode filter
        if (filter.postcodes && filter.postcodes.length > 0) {
            const postcodeConditions = filter.postcodes.map((pc, index) => {
                query.setParameter(`postcode${index}`, `${pc}%`);
                return `(lead.fromPostcode ILIKE :postcode${index} OR lead.toPostcode ILIKE :postcode${index})`;
            });
            query.andWhere(`(${postcodeConditions.join(' OR ')})`);
        }

        // Date filter
        if (filter.dateFrom) {
            query.andWhere('lead.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
        }
        if (filter.dateTo) {
            query.andWhere('lead.createdAt <= :dateTo', { dateTo: filter.dateTo });
        }

        // Source filter
        if (filter.source) {
            query.andWhere('lead.source = :source', { source: filter.source });
        }

        // Assigned to filter
        if (filter.assignedToId) {
            query.andWhere('lead.assignedToId = :assignedToId', { assignedToId: filter.assignedToId });
        }

        return query;
    }
}
