import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityType, Lead } from '../entities';
import { CreateActivityDto, CreateNoteDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  /**
   * Get all activities for a lead, ordered by most recent first
   */
  async findByLead(leadId: string): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { leadId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create a new activity (internal use)
   */
  async create(dto: CreateActivityDto, userId?: string): Promise<Activity> {
    const activity = this.activityRepository.create({
      leadId: dto.leadId,
      type: dto.type,
      description: dto.description,
      metadata: dto.metadata,
      userId,
    });
    return this.activityRepository.save(activity);
  }

  /**
   * Add a manual note to a lead
   */
  async addNote(
    leadId: string,
    dto: CreateNoteDto,
    userId: string,
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      leadId,
      type: ActivityType.NOTE,
      description: dto.description,
      userId,
    });
    return this.activityRepository.save(activity);
  }

  /**
   * Log a status change activity
   */
  async logStatusChange(
    leadId: string,
    oldStatus: string,
    newStatus: string,
    userId?: string,
  ): Promise<Activity> {
    return this.create(
      {
        leadId,
        type: ActivityType.STATUS_CHANGE,
        description: `Status changed from "${oldStatus}" to "${newStatus}"`,
        metadata: { oldStatus, newStatus },
      },
      userId,
    );
  }

  /**
   * Log an email activity
   */
  async logEmail(
    leadId: string,
    direction: 'inbound' | 'outbound',
    subject: string,
    userId?: string,
  ): Promise<Activity> {
    const desc =
      direction === 'outbound'
        ? `Email sent: "${subject}"`
        : `Email received: "${subject}"`;

    return this.create(
      {
        leadId,
        type: ActivityType.EMAIL,
        description: desc,
        metadata: { direction, subject },
      },
      userId,
    );
  }

  /**
   * Log a call activity
   */
  async logCall(
    leadId: string,
    direction: 'inbound' | 'outbound',
    duration?: number,
    notes?: string,
    userId?: string,
  ): Promise<Activity> {
    const durationStr = duration
      ? ` (${Math.floor(duration / 60)}m ${duration % 60}s)`
      : '';
    const desc =
      direction === 'outbound'
        ? `Outbound call${durationStr}`
        : `Inbound call${durationStr}`;

    return this.create(
      {
        leadId,
        type: ActivityType.CALL,
        description: notes ? `${desc} - ${notes}` : desc,
        metadata: { direction, duration, notes },
      },
      userId,
    );
  }

  /**
   * Log an assessment activity
   */
  async logAssessment(
    leadId: string,
    assessmentType: string,
    status: string,
    userId?: string,
  ): Promise<Activity> {
    return this.create(
      {
        leadId,
        type: ActivityType.ASSESSMENT,
        description: `${assessmentType} assessment ${status}`,
        metadata: { assessmentType, status },
      },
      userId,
    );
  }

  /**
   * Get recent activities across all leads (for dashboard)
   */
  async getRecent(limit: number = 10): Promise<Activity[]> {
    return this.activityRepository.find({
      relations: ['lead', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
