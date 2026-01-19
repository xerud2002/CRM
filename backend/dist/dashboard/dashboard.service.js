"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let DashboardService = class DashboardService {
    leadRepository;
    activityRepository;
    emailRepository;
    callRepository;
    assessmentRepository;
    constructor(leadRepository, activityRepository, emailRepository, callRepository, assessmentRepository) {
        this.leadRepository = leadRepository;
        this.activityRepository = activityRepository;
        this.emailRepository = emailRepository;
        this.callRepository = callRepository;
        this.assessmentRepository = assessmentRepository;
    }
    async getOverview(filter) {
        const contactMetrics = await this.getContactMetrics(filter);
        const methodBreakdown = await this.getMethodBreakdown(filter);
        const conversionFunnel = await this.getConversionFunnel(filter);
        return {
            contactMetrics,
            methodBreakdown,
            conversionFunnel,
        };
    }
    async getContactMetrics(filter) {
        const query = this.leadRepository.createQueryBuilder('lead');
        this.applyFilters(query, filter);
        const totalLeads = await query.getCount();
        const contacted = await query
            .clone()
            .andWhere('lead.contactStatus IN (:...statuses)', {
            statuses: [entities_1.ContactStatus.CONTACTED, entities_1.ContactStatus.RESPONDED, entities_1.ContactStatus.NO_RESPONSE],
        })
            .getCount();
        const responded = await query
            .clone()
            .andWhere('lead.contactStatus = :status', { status: entities_1.ContactStatus.RESPONDED })
            .getCount();
        const noResponse = await query
            .clone()
            .andWhere('lead.contactStatus = :status', { status: entities_1.ContactStatus.NO_RESPONSE })
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
    async getMethodBreakdown(filter) {
        const emailQuery = this.emailRepository.createQueryBuilder('email');
        const callQuery = this.callRepository.createQueryBuilder('call');
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
    async getConversionFunnel(filter) {
        const leadQuery = this.leadRepository.createQueryBuilder('lead');
        this.applyFilters(leadQuery, filter);
        const totalLeads = await leadQuery.getCount();
        const surveyBooked = await this.assessmentRepository
            .createQueryBuilder('assessment')
            .select('COUNT(DISTINCT assessment.leadId)', 'count')
            .getRawOne()
            .then((r) => parseInt(r.count, 10));
        const surveyCompleted = await this.assessmentRepository
            .createQueryBuilder('assessment')
            .select('COUNT(DISTINCT assessment.leadId)', 'count')
            .where('assessment.status = :status', { status: entities_1.AssessmentStatus.COMPLETED })
            .getRawOne()
            .then((r) => parseInt(r.count, 10));
        const quoteSent = await leadQuery
            .clone()
            .andWhere('lead.quoteAmount IS NOT NULL')
            .getCount();
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
    async getByLocation(filter) {
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
    applyFilters(query, filter) {
        query.andWhere('lead.status NOT IN (:...excludeStatuses)', {
            excludeStatuses: [entities_1.LeadStatus.PENDING, entities_1.LeadStatus.REJECTED],
        });
        if (filter.postcodes && filter.postcodes.length > 0) {
            const postcodeConditions = filter.postcodes.map((pc, index) => {
                query.setParameter(`postcode${index}`, `${pc}%`);
                return `(lead.fromPostcode ILIKE :postcode${index} OR lead.toPostcode ILIKE :postcode${index})`;
            });
            query.andWhere(`(${postcodeConditions.join(' OR ')})`);
        }
        if (filter.dateFrom) {
            query.andWhere('lead.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
        }
        if (filter.dateTo) {
            query.andWhere('lead.createdAt <= :dateTo', { dateTo: filter.dateTo });
        }
        if (filter.source) {
            query.andWhere('lead.source = :source', { source: filter.source });
        }
        if (filter.assignedToId) {
            query.andWhere('lead.assignedToId = :assignedToId', { assignedToId: filter.assignedToId });
        }
        return query;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Lead)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Activity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Email)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Call)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Assessment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map