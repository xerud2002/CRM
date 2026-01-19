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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let LeadsService = class LeadsService {
    leadRepository;
    activityRepository;
    constructor(leadRepository, activityRepository) {
        this.leadRepository = leadRepository;
        this.activityRepository = activityRepository;
    }
    async findAll(filter) {
        const query = this.leadRepository.createQueryBuilder('lead');
        if (filter.status) {
            query.andWhere('lead.status = :status', { status: filter.status });
        }
        else {
            query.andWhere('lead.status != :pendingStatus', { pendingStatus: entities_1.LeadStatus.PENDING });
        }
        if (filter.contactStatus) {
            query.andWhere('lead.contactStatus = :contactStatus', { contactStatus: filter.contactStatus });
        }
        if (filter.postcodes && filter.postcodes.length > 0) {
            const postcodeConditions = filter.postcodes.map((pc, index) => {
                query.setParameter(`postcode${index}`, `${pc}%`);
                return `(lead.fromPostcode ILIKE :postcode${index} OR lead.toPostcode ILIKE :postcode${index})`;
            });
            query.andWhere(`(${postcodeConditions.join(' OR ')})`);
        }
        if (filter.source) {
            query.andWhere('lead.source = :source', { source: filter.source });
        }
        if (filter.assignedToId) {
            query.andWhere('lead.assignedToId = :assignedToId', { assignedToId: filter.assignedToId });
        }
        if (filter.search) {
            query.andWhere('(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search OR lead.phone ILIKE :search)', { search: `%${filter.search}%` });
        }
        if (filter.dateFrom) {
            query.andWhere('lead.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
        }
        if (filter.dateTo) {
            query.andWhere('lead.createdAt <= :dateTo', { dateTo: filter.dateTo });
        }
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        query.skip((page - 1) * limit).take(limit);
        query.orderBy('lead.createdAt', 'DESC');
        const [leads, total] = await query.getManyAndCount();
        return {
            data: leads,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findInbox() {
        return this.leadRepository.find({
            where: { status: entities_1.LeadStatus.PENDING },
            order: { createdAt: 'DESC' },
        });
    }
    async getInboxCount() {
        return this.leadRepository.count({
            where: { status: entities_1.LeadStatus.PENDING },
        });
    }
    async findOne(id) {
        const lead = await this.leadRepository.findOne({
            where: { id },
            relations: ['assignedTo'],
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead with ID ${id} not found`);
        }
        return lead;
    }
    async create(createLeadDto, userId) {
        if (createLeadDto.email) {
            const existingByEmail = await this.leadRepository.findOne({
                where: { email: createLeadDto.email },
            });
            if (existingByEmail) {
                throw new common_1.ConflictException(`Lead with email ${createLeadDto.email} already exists`);
            }
        }
        const lead = this.leadRepository.create({
            ...createLeadDto,
            status: entities_1.LeadStatus.PENDING,
        });
        const savedLead = await this.leadRepository.save(lead);
        await this.logActivity(savedLead.id, entities_1.ActivityType.STATUS_CHANGE, 'Lead created', userId);
        return savedLead;
    }
    async update(id, updateLeadDto, userId) {
        const lead = await this.findOne(id);
        const previousStatus = lead.status;
        Object.assign(lead, updateLeadDto);
        const updatedLead = await this.leadRepository.save(lead);
        if (updateLeadDto.status && updateLeadDto.status !== previousStatus) {
            await this.logActivity(id, entities_1.ActivityType.STATUS_CHANGE, `Status changed from ${previousStatus} to ${updateLeadDto.status}`, userId);
        }
        return updatedLead;
    }
    async accept(id, userId) {
        const lead = await this.findOne(id);
        lead.status = entities_1.LeadStatus.NEW;
        const updatedLead = await this.leadRepository.save(lead);
        await this.logActivity(id, entities_1.ActivityType.STATUS_CHANGE, 'Lead accepted', userId);
        return updatedLead;
    }
    async reject(id, userId) {
        const lead = await this.findOne(id);
        lead.status = entities_1.LeadStatus.REJECTED;
        const updatedLead = await this.leadRepository.save(lead);
        await this.logActivity(id, entities_1.ActivityType.STATUS_CHANGE, 'Lead rejected', userId);
        return updatedLead;
    }
    async delete(id) {
        const lead = await this.findOne(id);
        return this.leadRepository.softRemove(lead);
    }
    async logActivity(leadId, type, description, userId) {
        const activity = this.activityRepository.create({
            leadId,
            type,
            description,
            userId,
        });
        return this.activityRepository.save(activity);
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Lead)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Activity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LeadsService);
//# sourceMappingURL=leads.service.js.map