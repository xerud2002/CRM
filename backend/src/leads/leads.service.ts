import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus, Activity, ActivityType } from '../entities';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async findAll(filter: LeadFilterDto) {
    const query = this.leadRepository.createQueryBuilder('lead');

    // Filter by status (exclude pending for main list)
    if (filter.status) {
      query.andWhere('lead.status = :status', { status: filter.status });
    } else {
      query.andWhere('lead.status != :pendingStatus', {
        pendingStatus: LeadStatus.PENDING,
      });
    }

    // Filter by contact status
    if (filter.contactStatus) {
      query.andWhere('lead.contactStatus = :contactStatus', {
        contactStatus: filter.contactStatus,
      });
    }

    // Filter by postcode
    if (filter.postcodes && filter.postcodes.length > 0) {
      const postcodeConditions = filter.postcodes.map((pc, index) => {
        query.setParameter(`postcode${index}`, `${pc}%`);
        return `(lead.fromPostcode ILIKE :postcode${index} OR lead.toPostcode ILIKE :postcode${index})`;
      });
      query.andWhere(`(${postcodeConditions.join(' OR ')})`);
    }

    // Filter by source
    if (filter.source) {
      query.andWhere('lead.source = :source', { source: filter.source });
    }

    // Filter by assigned user
    if (filter.assignedToId) {
      query.andWhere('lead.assignedToId = :assignedToId', {
        assignedToId: filter.assignedToId,
      });
    }

    // Search by name, email, phone
    if (filter.search) {
      query.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search OR lead.phone ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    // Date range
    if (filter.dateFrom) {
      query.andWhere('lead.createdAt >= :dateFrom', {
        dateFrom: filter.dateFrom,
      });
    }
    if (filter.dateTo) {
      query.andWhere('lead.createdAt <= :dateTo', { dateTo: filter.dateTo });
    }

    // Pagination
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    // Order
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
      where: { status: LeadStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async getInboxCount() {
    return this.leadRepository.count({
      where: { status: LeadStatus.PENDING },
    });
  }

  async findOne(id: string) {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    return lead;
  }

  async create(createLeadDto: CreateLeadDto, userId?: string) {
    // Check for duplicates
    if (createLeadDto.email) {
      const existingByEmail = await this.leadRepository.findOne({
        where: { email: createLeadDto.email },
      });
      if (existingByEmail) {
        throw new ConflictException(
          `Lead with email ${createLeadDto.email} already exists`,
        );
      }
    }

    const lead = this.leadRepository.create({
      ...createLeadDto,
      status: LeadStatus.PENDING,
    });

    const savedLead = await this.leadRepository.save(lead);

    // Log activity
    await this.logActivity(
      savedLead.id,
      ActivityType.STATUS_CHANGE,
      'Lead created',
      userId,
    );

    return savedLead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, userId?: string) {
    const lead = await this.findOne(id);
    const previousStatus = lead.status;

    Object.assign(lead, updateLeadDto);
    const updatedLead = await this.leadRepository.save(lead);

    // Log status change if changed
    if (updateLeadDto.status && updateLeadDto.status !== previousStatus) {
      await this.logActivity(
        id,
        ActivityType.STATUS_CHANGE,
        `Status changed from ${previousStatus} to ${updateLeadDto.status}`,
        userId,
      );
    }

    return updatedLead;
  }

  async accept(id: string, userId?: string) {
    const lead = await this.findOne(id);
    lead.status = LeadStatus.NEW;
    const updatedLead = await this.leadRepository.save(lead);

    await this.logActivity(
      id,
      ActivityType.STATUS_CHANGE,
      'Lead accepted',
      userId,
    );

    return updatedLead;
  }

  async reject(id: string, userId?: string) {
    const lead = await this.findOne(id);
    lead.status = LeadStatus.REJECTED;
    const updatedLead = await this.leadRepository.save(lead);

    await this.logActivity(
      id,
      ActivityType.STATUS_CHANGE,
      'Lead rejected',
      userId,
    );

    return updatedLead;
  }

  async delete(id: string) {
    const lead = await this.findOne(id);
    return this.leadRepository.softRemove(lead);
  }

  private async logActivity(
    leadId: string,
    type: ActivityType,
    description: string,
    userId?: string,
  ) {
    const activity = this.activityRepository.create({
      leadId,
      type,
      description,
      userId,
    });
    return this.activityRepository.save(activity);
  }
}
