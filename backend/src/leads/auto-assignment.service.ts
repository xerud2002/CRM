import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import {
  User,
  Lead,
  LeadStatus,
  LeadSource,
  Activity,
  ActivityType,
} from '../entities';

export interface AssignmentConditions {
  sources?: LeadSource[];
  postcodes?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
}

export interface AssignmentRule {
  id: string;
  name: string;
  conditions: AssignmentConditions;
  assignToUserId: string;
  priority: number;
  enabled: boolean;
}

@Injectable()
export class AutoAssignmentService implements OnModuleInit {
  private staffUsers: User[] = [];
  private lastAssignedIndex = 0;
  private rules: AssignmentRule[] = [];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadStaffUsers();
  }

  private async loadStaffUsers(): Promise<void> {
    this.staffUsers = await this.userRepository.find({
      where: { isActive: true },
    });
    console.log(
      `Auto-assignment service initialized with ${this.staffUsers.length} staff users`,
    );
  }

  async assignLead(lead: Lead): Promise<Lead> {
    for (const rule of this.rules
      .filter((r) => r.enabled)
      .sort((a, b) => a.priority - b.priority)) {
      if (this.matchesRule(lead, rule)) {
        const assignee = this.staffUsers.find(
          (u) => u.id === rule.assignToUserId,
        );
        if (assignee) {
          return this.performAssignment(lead, assignee, `Rule: ${rule.name}`);
        }
      }
    }
    return this.roundRobinAssign(lead);
  }

  private matchesRule(lead: Lead, rule: AssignmentRule): boolean {
    const { conditions } = rule;

    if (conditions.sources && conditions.sources.length > 0) {
      if (!conditions.sources.includes(lead.source)) {
        return false;
      }
    }

    if (conditions.postcodes && conditions.postcodes.length > 0) {
      const leadPostcode = (lead.fromPostcode || '').toUpperCase();
      const matches = conditions.postcodes.some((pc) =>
        leadPostcode.startsWith(pc.toUpperCase()),
      );
      if (!matches) {
        return false;
      }
    }

    if (conditions.minBedrooms !== undefined && lead.bedrooms) {
      if (lead.bedrooms < conditions.minBedrooms) {
        return false;
      }
    }

    if (conditions.maxBedrooms !== undefined && lead.bedrooms) {
      if (lead.bedrooms > conditions.maxBedrooms) {
        return false;
      }
    }

    return true;
  }

  private async roundRobinAssign(lead: Lead): Promise<Lead> {
    if (this.staffUsers.length === 0) {
      return lead;
    }

    const workloads = await Promise.all(
      this.staffUsers.map(async (user) => {
        const count = await this.leadRepository.count({
          where: {
            assignedToId: user.id,
            status: Not(In([LeadStatus.WON, LeadStatus.LOST])),
          },
        });
        return { user, count };
      }),
    );

    workloads.sort((a, b) => a.count - b.count);
    const selectedUser = workloads[0].user;

    return this.performAssignment(
      lead,
      selectedUser,
      'Round-robin (load balanced)',
    );
  }

  private async performAssignment(
    lead: Lead,
    user: User,
    reason: string,
  ): Promise<Lead> {
    lead.assignedToId = user.id;
    lead.assignedTo = user;
    const updatedLead = await this.leadRepository.save(lead);

    await this.activityRepository.save({
      leadId: lead.id,
      type: ActivityType.ASSIGNMENT,
      description: `Lead auto-assigned to ${user.name}`,
      metadata: {
        assignedToId: user.id,
        assignedToName: user.name,
        reason,
      },
    });

    return updatedLead;
  }

  getRules(): AssignmentRule[] {
    return this.rules;
  }

  addRule(rule: Omit<AssignmentRule, 'id'>): AssignmentRule {
    const newRule: AssignmentRule = {
      ...rule,
      id: `rule_${Date.now()}`,
    };
    this.rules.push(newRule);
    return newRule;
  }

  updateRule(
    id: string,
    updates: Partial<AssignmentRule>,
  ): AssignmentRule | null {
    const index = this.rules.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.rules[index] = { ...this.rules[index], ...updates };
    return this.rules[index];
  }

  deleteRule(id: string): boolean {
    const index = this.rules.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.rules.splice(index, 1);
    return true;
  }

  async getStaffWorkload(): Promise<
    Array<{
      userId: string;
      name: string;
      activeLeads: number;
      totalAssigned: number;
    }>
  > {
    const result = await Promise.all(
      this.staffUsers.map(async (user) => {
        const activeLeads = await this.leadRepository.count({
          where: {
            assignedToId: user.id,
            status: Not(In([LeadStatus.WON, LeadStatus.LOST])),
          },
        });
        const totalAssigned = await this.leadRepository.count({
          where: { assignedToId: user.id },
        });
        return {
          userId: user.id,
          name: user.name,
          activeLeads,
          totalAssigned,
        };
      }),
    );
    return result;
  }

  async manualAssign(
    leadId: string,
    userId: string,
    assignedByUserId?: string,
  ): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: ['assignedTo'],
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousAssignee = lead.assignedTo?.name;
    lead.assignedToId = user.id;
    lead.assignedTo = user;
    const updatedLead = await this.leadRepository.save(lead);

    await this.activityRepository.save({
      leadId: lead.id,
      userId: assignedByUserId,
      type: ActivityType.ASSIGNMENT,
      description: previousAssignee
        ? `Lead reassigned from ${previousAssignee} to ${user.name}`
        : `Lead manually assigned to ${user.name}`,
      metadata: {
        assignedToId: user.id,
        assignedToName: user.name,
        previousAssignee,
        manual: true,
      },
    });

    return updatedLead;
  }
}
