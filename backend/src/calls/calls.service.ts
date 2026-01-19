import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Call,
  CallDirection,
  CallStatus,
  Lead,
  Activity,
  ActivityType,
} from '../entities';
import { CreateCallDto, UpdateCallDto, CallQueryDto } from './dto/call.dto';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(dto: CreateCallDto, userId: string): Promise<Call> {
    // Verify lead exists
    const lead = await this.leadRepository.findOne({
      where: { id: dto.leadId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const call = this.callRepository.create({
      leadId: dto.leadId,
      userId,
      direction: dto.direction,
      status: dto.status || CallStatus.NO_ANSWER,
      answered: dto.status === CallStatus.ANSWERED,
      durationSeconds: dto.durationSeconds,
      notes: dto.notes,
      followUpRequired: dto.followUpRequired,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
    });

    const savedCall = await this.callRepository.save(call);

    // Create activity log
    const directionText =
      dto.direction === CallDirection.OUTBOUND ? 'Outbound' : 'Inbound';
    const statusText = this.getStatusText(dto.status || CallStatus.NO_ANSWER);
    const durationText = dto.durationSeconds
      ? ` (${Math.floor(dto.durationSeconds / 60)}:${(dto.durationSeconds % 60).toString().padStart(2, '0')})`
      : '';

    const activity = this.activityRepository.create({
      type: ActivityType.CALL,
      description: `${directionText} call - ${statusText}${durationText}`,
      lead,
      userId,
      metadata: {
        callId: savedCall.id,
        direction: dto.direction,
        status: dto.status || CallStatus.NO_ANSWER,
        duration: dto.durationSeconds,
        notes: dto.notes,
      },
    });

    await this.activityRepository.save(activity);

    return savedCall;
  }

  async findAll(query: CallQueryDto): Promise<{ data: Call[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.callRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.lead', 'lead')
      .leftJoinAndSelect('call.user', 'user')
      .orderBy('call.createdAt', 'DESC');

    if (query.leadId) {
      qb.andWhere('call.leadId = :leadId', { leadId: query.leadId });
    }

    if (query.direction) {
      qb.andWhere('call.direction = :direction', {
        direction: query.direction,
      });
    }

    if (query.status) {
      qb.andWhere('call.status = :status', { status: query.status });
    }

    if (query.followUpRequired !== undefined) {
      qb.andWhere('call.followUpRequired = :followUp', {
        followUp: query.followUpRequired,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { data, total };
  }

  async findByLead(leadId: string): Promise<Call[]> {
    return this.callRepository.find({
      where: { leadId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id },
      relations: ['lead', 'user'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return call;
  }

  async update(id: string, dto: UpdateCallDto): Promise<Call> {
    const call = await this.findOne(id);

    if (dto.status !== undefined) {
      call.status = dto.status;
      call.answered = dto.status === CallStatus.ANSWERED;
    }

    if (dto.durationSeconds !== undefined) {
      call.durationSeconds = dto.durationSeconds;
    }

    if (dto.notes !== undefined) {
      call.notes = dto.notes;
    }

    if (dto.followUpRequired !== undefined) {
      call.followUpRequired = dto.followUpRequired;
    }

    if (dto.followUpDate !== undefined) {
      call.followUpDate = new Date(dto.followUpDate);
    }

    return this.callRepository.save(call);
  }

  async delete(id: string): Promise<void> {
    const call = await this.findOne(id);
    await this.callRepository.remove(call);
  }

  async getFollowUps(): Promise<Call[]> {
    return this.callRepository.find({
      where: { followUpRequired: true },
      relations: ['lead', 'user'],
      order: { followUpDate: 'ASC' },
    });
  }

  async getStats(): Promise<{
    today: { total: number; answered: number; missed: number };
    week: { total: number; answered: number; missed: number };
    byDirection: { inbound: number; outbound: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Today's stats
    const todayCalls = await this.callRepository
      .createQueryBuilder('call')
      .where('call.createdAt >= :today', { today })
      .getMany();

    // Week stats
    const weekCalls = await this.callRepository
      .createQueryBuilder('call')
      .where('call.createdAt >= :weekAgo', { weekAgo })
      .getMany();

    // By direction (all time)
    const directionStats: { direction: string; count: string }[] =
      await this.callRepository
        .createQueryBuilder('call')
        .select('call.direction', 'direction')
        .addSelect('COUNT(*)', 'count')
        .groupBy('call.direction')
        .getRawMany();

    const inbound =
      directionStats.find((d) => d.direction === 'inbound')?.count || '0';
    const outbound =
      directionStats.find((d) => d.direction === 'outbound')?.count || '0';

    return {
      today: {
        total: todayCalls.length,
        answered: todayCalls.filter((c) => c.status === CallStatus.ANSWERED)
          .length,
        missed: todayCalls.filter(
          (c) =>
            c.status === CallStatus.MISSED || c.status === CallStatus.NO_ANSWER,
        ).length,
      },
      week: {
        total: weekCalls.length,
        answered: weekCalls.filter((c) => c.status === CallStatus.ANSWERED)
          .length,
        missed: weekCalls.filter(
          (c) =>
            c.status === CallStatus.MISSED || c.status === CallStatus.NO_ANSWER,
        ).length,
      },
      byDirection: {
        inbound: parseInt(inbound, 10),
        outbound: parseInt(outbound, 10),
      },
    };
  }

  private getStatusText(status: CallStatus): string {
    switch (status) {
      case CallStatus.ANSWERED:
        return 'Answered';
      case CallStatus.MISSED:
        return 'Missed';
      case CallStatus.VOICEMAIL:
        return 'Voicemail';
      case CallStatus.NO_ANSWER:
        return 'No Answer';
      default:
        return status;
    }
  }
}
