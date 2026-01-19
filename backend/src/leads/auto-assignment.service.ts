import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, Lead, LeadStatus, LeadSource, Activity, ActivityType } from '../entities';

export interface AssignmentRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: {
    sources?: LeadSource[];
    postcodes?: string[];
    minBedrooms?: number;
    maxBedrooms?: number;
  };
  assignToUserId: string;
}

@Injectable()
export class AutoAssignmentService implements OnModuleInit {
  // In-memory rules storage (could be moved to database)
  private rules: AssignmentRule[] = [];
  private roundRobinIndex = 0;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async onModuleInit() {
    // Load default rules on startup
    await this.loadDefaultRules();
  }

  private async loadDefaultRules() {
    // Get active staff users
    const staffUsers = await this.userRepository.find({
      where: { isActive: true },
    });

    // Default: round-robin assignment to all active staff
    if (staffUsers.length > 0) {
      console.log(`Auto-assignment service initialized with ${staffUsers.length} staff users`);
    }
  }

  async assignLead(lead: Lead): Promise<Lead | null> {
    // Skip if already assigned
    if (lead.assignedToId) {
      return null;
    }

    // Try rule-based assignment first
    for (const rule of this.rules.filter(r => r.enabled).sort((a, b) => a.priority - b.priority)) {
      if (this.matchesRule(lead, rule)) {
        const user = await this.userRepository.findOne({
          where: { id: rule.assignToUserId, isActive: true },
        });
        if (user) {
          return this.performAssignment(lead, user, `Rule: ${rule.name}`);
        }
      }
    }

    // Fall back to round-robin
    return this.assignRoundRobin(lead);
  }

  private matchesRule(lead: Lead, rule: AssignmentRule): boolean {
    const { conditions } = rule;

    // Check source
    if (conditions.sources && conditions.sources.length > 0) {
      if (!conditions.sources.includes(lead.source)) {
        return false;
      }
    }

    // Check postcode prefix
    if (conditions.postcodes && conditions.postcodes.length > 0) {
      const leadPostcode = (lead.fromPostcode || '').toUpperCase();
      const matches = conditions.postcodes.some(pc => 
        leadPostcode.startsWith(pc.toUpperCase())
      );
      if (!matches) {
        return false;
      }
    }

    // Check bedrooms
    if (conditions.minBedrooms !== undefined && lead.bedrooms !== undefined) {
      if (lead.bedrooms < conditions.minBedrooms) {
        return false;
      }
    }
    if (conditions.maxBedrooms !== undefined && lead.bedrooms !== undefined) {
      if (lead.bedrooms > conditions.maxBedrooms) {
        return false;
      }
    }

    return true;
  }

  private async assignRoundRobin(lead: Lead): Promise<Lead | null> {
    const staffUsers = await this.userRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    if (staffUsers.length === 0) {
      return null;
    }

    // Get user with least active leads (load balancing)
    const userLoads = await Promise.all(
      staffUsers.map(async (user) => {
        const count = await this.leadRepository.count({
          where: {
            assignedToId: user.id,
            status: LeadStatus.NEW,
          },
        });
        return { user, count };
      })
    );

    // Sort by load (ascending) and pick the least loaded
    userLoads.sort((a, b) => a.count - b.count);
    const selectedUser = userLoads[0].user;

    return this.performAssignment(lead, selectedUser, 'Round-robin (load balanced)');
  }

  private async performAssignment(lead: Lead, user: User, reason: string): Promise<Lead> {
    lead.assignedToId = user.id;
    lead.assignedTo = user;
    
    const updatedLead = await this.leadRepository.save(lead);

    // Log activity
    await this.activityRepository.save({
      leadId: lead.id,
      type: ActivityType.STATUS_CHANGE,
      description: `Auto-assigned to ${user.name} (${reason})`,
      metadata: {
        type: 'auto_assignment',
        assignedToId: user.id,
        assignedToName: user.name,
        reason,
      },
    });

    return updatedLead;
  }

  // Rule management methods
  async getRules(): Promise<AssignmentRule[]> {
    return this.rules;
  }

  async addRule(rule: Omit<AssignmentRule, 'id'>): Promise<AssignmentRule> {
    const newRule: AssignmentRule = {
      ...rule,
      id: `rule_${Date.now()}`,
    };
    this.rules.push(newRule);
    return newRule;
  }

  async updateRule(id: string, updates: Partial<AssignmentRule>): Promise<AssignmentRule | null> {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    this.rules[index] = { ...this.rules[index], ...updates };
    return this.rules[index];
  }

  async deleteRule(id: string): Promise<boolean> {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.rules.splice(index, 1);
    return true;
  }

  async getStaffWorkload() {
    const staffUsers = await this.userRepository.find({
      where: { isActive: true },
    });

    return Promise.all(
      staffUsers.map(async (user) => {
        const activeLeads = await this.leadRepository.count({
          where: {
            assignedToId: user.id,
            status: LeadStatus.NEW,
          },
        });
        const totalLeads = await this.leadRepository.count({
          where: { assignedToId: user.id },
        });

        return {
          userId: user.id,
          name: user.name,
          activeLeads,
          totalLeads,
        };
      })
    );
  }

  // Manual assignment
  async manualAssign(leadId: string, userId: string, assignedByUserId?: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new Error('Lead not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const previousAssignee = lead.assignedToId;
    lead.assignedToId = user.id;
    lead.assignedTo = user;

    const updatedLead = await this.leadRepository.save(lead);

    await this.activityRepository.save({
      leadId: lead.id,
      type: ActivityType.STATUS_CHANGE,
      description: previousAssignee 
        ? `Reassigned to ${user.name}`
        : `Assigned to ${user.name}`,
      userId: assignedByUserId,
      metadata: {
        type: 'manual_assignment',
        assignedToId: user.id,
        assignedToName: user.name,
        previousAssigneeId: previousAssignee,
      },
    });

    return updatedLead;
  }
}
