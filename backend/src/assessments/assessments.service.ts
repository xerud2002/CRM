import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Assessment, AssessmentStatus, AssessmentType } from '../entities';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  AssessmentFilterDto,
} from './dto';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(dto: CreateAssessmentDto, userId: string): Promise<Assessment> {
    const assessment = this.assessmentRepository.create({
      ...dto,
      assessmentDate: new Date(dto.assessmentDate),
      moveDate: dto.moveDate ? new Date(dto.moveDate) : undefined,
    });

    const saved = await this.assessmentRepository.save(assessment);

    // Log activity
    await this.activitiesService.logAssessment(
      dto.leadId,
      userId,
      saved.id,
      `${dto.type === AssessmentType.VIDEO ? 'Video' : 'In-person'} assessment scheduled for ${dto.assessmentDate} at ${dto.assessmentTime}`,
    );

    return this.findOne(saved.id);
  }

  async findAll(
    filter: AssessmentFilterDto,
  ): Promise<{ data: Assessment[]; meta: any }> {
    const {
      type,
      status,
      leadId,
      assignedToId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filter;

    const queryBuilder = this.assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.lead', 'lead')
      .leftJoinAndSelect('assessment.assignedTo', 'assignedTo');

    if (type) {
      queryBuilder.andWhere('assessment.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('assessment.status = :status', { status });
    }

    if (leadId) {
      queryBuilder.andWhere('assessment.leadId = :leadId', { leadId });
    }

    if (assignedToId) {
      queryBuilder.andWhere('assessment.assignedToId = :assignedToId', {
        assignedToId,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'assessment.assessmentDate BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    } else if (startDate) {
      queryBuilder.andWhere('assessment.assessmentDate >= :startDate', {
        startDate,
      });
    } else if (endDate) {
      queryBuilder.andWhere('assessment.assessmentDate <= :endDate', {
        endDate,
      });
    }

    queryBuilder
      .orderBy('assessment.assessmentDate', 'ASC')
      .addOrderBy('assessment.assessmentTime', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id },
      relations: ['lead', 'assignedTo'],
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async update(
    id: string,
    dto: UpdateAssessmentDto,
    userId: string,
  ): Promise<Assessment> {
    const assessment = await this.findOne(id);

    // Track status change for activity log
    const oldStatus = assessment.status;
    const newStatus = dto.status;

    Object.assign(assessment, {
      ...dto,
      assessmentDate: dto.assessmentDate
        ? new Date(dto.assessmentDate)
        : assessment.assessmentDate,
      moveDate: dto.moveDate ? new Date(dto.moveDate) : assessment.moveDate,
    });

    const saved = await this.assessmentRepository.save(assessment);

    // Log status change activity
    if (newStatus && newStatus !== oldStatus) {
      await this.activitiesService.logAssessment(
        assessment.leadId,
        userId,
        assessment.id,
        `Assessment status changed from ${oldStatus} to ${newStatus}`,
      );
    }

    return this.findOne(saved.id);
  }

  async remove(id: string): Promise<void> {
    const assessment = await this.findOne(id);
    await this.assessmentRepository.remove(assessment);
  }

  async getCalendarEvents(
    startDate: string,
    endDate: string,
    type?: AssessmentType,
  ): Promise<Assessment[]> {
    const queryBuilder = this.assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.lead', 'lead')
      .leftJoinAndSelect('assessment.assignedTo', 'assignedTo')
      .where('assessment.assessmentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('assessment.status != :cancelled', {
        cancelled: AssessmentStatus.CANCELLED,
      });

    if (type) {
      queryBuilder.andWhere('assessment.type = :type', { type });
    }

    return queryBuilder
      .orderBy('assessment.assessmentDate', 'ASC')
      .addOrderBy('assessment.assessmentTime', 'ASC')
      .getMany();
  }

  async getUpcoming(limit: number = 10): Promise<Assessment[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.assessmentRepository.find({
      where: {
        assessmentDate: MoreThanOrEqual(new Date(today)),
        status: AssessmentStatus.SCHEDULED,
      },
      relations: ['lead', 'assignedTo'],
      order: {
        assessmentDate: 'ASC',
        assessmentTime: 'ASC',
      },
      take: limit,
    });
  }

  async getByLead(leadId: string): Promise<Assessment[]> {
    return this.assessmentRepository.find({
      where: { leadId },
      relations: ['assignedTo'],
      order: {
        assessmentDate: 'DESC',
        assessmentTime: 'DESC',
      },
    });
  }

  async completeAssessment(
    id: string,
    outcome: string,
    userId: string,
  ): Promise<Assessment> {
    return this.update(
      id,
      {
        status: AssessmentStatus.COMPLETED,
        outcome,
      },
      userId,
    );
  }

  async cancelAssessment(
    id: string,
    reason: string,
    userId: string,
  ): Promise<Assessment> {
    const assessment = await this.findOne(id);
    assessment.status = AssessmentStatus.CANCELLED;
    assessment.notes = assessment.notes
      ? `${assessment.notes}\n\nCancellation reason: ${reason}`
      : `Cancellation reason: ${reason}`;

    const saved = await this.assessmentRepository.save(assessment);

    await this.activitiesService.logAssessment(
      assessment.leadId,
      userId,
      assessment.id,
      `Assessment cancelled: ${reason}`,
    );

    return saved;
  }
}
