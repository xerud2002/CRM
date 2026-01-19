import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  Email,
  Lead,
  LeadStatus,
  ContactStatus,
  Activity,
  ActivityType,
  EmailDirection,
} from '../entities';
import { EmailParserFactory, ParsedLeadData } from '../emails/parsers';

export interface ProcessingResult {
  processed: number;
  leadsCreated: number;
  skipped: number;
  errors: string[];
  leads: { id: string; email: string; source: string }[];
}

@Injectable()
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);

  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    private readonly parserFactory: EmailParserFactory,
  ) {}

  /**
   * Process unprocessed incoming emails and create leads
   */
  async processIncomingEmails(): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      processed: 0,
      leadsCreated: 0,
      skipped: 0,
      errors: [],
      leads: [],
    };

    // Find unprocessed incoming emails (not linked to a lead)
    const unprocessedEmails = await this.emailRepository.find({
      where: {
        direction: EmailDirection.INBOUND,
        lead: IsNull(),
      },
      order: { sentAt: 'ASC' },
      take: 100, // Process in batches
    });

    this.logger.log(`Found ${unprocessedEmails.length} unprocessed emails`);

    for (const email of unprocessedEmails) {
      result.processed++;

      try {
        // Check if this is from a known lead source
        const parser = this.parserFactory.detectParser(
          email.fromAddress,
          email.subject,
        );

        if (!parser) {
          // Not a lead email - check if it's from an existing lead
          const existingLead = await this.findLeadByEmail(email.fromAddress);
          if (existingLead) {
            // Link email to existing lead
            email.lead = existingLead;
            await this.emailRepository.save(email);
            this.logger.log(
              `Linked email to existing lead: ${existingLead.email}`,
            );
          }
          result.skipped++;
          continue;
        }

        // Parse the email
        const parseResult = this.parserFactory.parseEmail(
          email.fromAddress,
          email.subject,
          email.body,
          email.body, // HTML is stored in body
        );

        if (!parseResult.success || !parseResult.lead) {
          result.errors.push(
            `Failed to parse email ${email.id}: ${parseResult.error}`,
          );
          result.skipped++;
          continue;
        }

        // Check for duplicate lead
        const duplicate = await this.findDuplicateLead(parseResult.lead);
        if (duplicate) {
          // Link email to existing lead instead
          email.lead = duplicate;
          await this.emailRepository.save(email);
          this.logger.log(`Email linked to existing lead: ${duplicate.email}`);
          result.skipped++;
          continue;
        }

        // Create new lead
        const lead = await this.createLeadFromParsedData(parseResult.lead, email);
        result.leadsCreated++;
        result.leads.push({
          id: lead.id,
          email: lead.email,
          source: lead.source,
        });

        this.logger.log(
          `Created lead from ${parseResult.lead.source}: ${lead.email}`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error processing email ${email.id}: ${errorMessage}`);
        this.logger.error(`Failed to process email ${email.id}:`, error);
      }
    }

    this.logger.log(
      `Processing complete: ${result.leadsCreated} leads created, ${result.skipped} skipped`,
    );

    return result;
  }

  /**
   * Process a single email and create lead if applicable
   */
  async processSingleEmail(emailId: string): Promise<{
    success: boolean;
    lead?: Lead;
    error?: string;
  }> {
    const email = await this.emailRepository.findOne({
      where: { id: emailId },
      relations: ['lead'],
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    if (email.lead) {
      return { success: false, error: 'Email already linked to a lead' };
    }

    const parser = this.parserFactory.detectParser(
      email.fromAddress,
      email.subject,
    );

    if (!parser) {
      return { success: false, error: 'No parser available for this email format' };
    }

    const parseResult = this.parserFactory.parseEmail(
      email.fromAddress,
      email.subject,
      email.body,
      email.body,
    );

    if (!parseResult.success || !parseResult.lead) {
      return { success: false, error: parseResult.error };
    }

    // Check for duplicates
    const duplicate = await this.findDuplicateLead(parseResult.lead);
    if (duplicate) {
      email.lead = duplicate;
      await this.emailRepository.save(email);
      return { success: true, lead: duplicate };
    }

    const lead = await this.createLeadFromParsedData(parseResult.lead, email);
    return { success: true, lead };
  }

  /**
   * Find existing lead by email address
   */
  private async findLeadByEmail(emailAddress: string): Promise<Lead | null> {
    return this.leadRepository.findOne({
      where: { email: emailAddress.toLowerCase() },
    });
  }

  /**
   * Find duplicate lead based on email or phone
   */
  private async findDuplicateLead(data: ParsedLeadData): Promise<Lead | null> {
    if (data.email) {
      const byEmail = await this.leadRepository.findOne({
        where: { email: data.email.toLowerCase() },
      });
      if (byEmail) return byEmail;
    }

    if (data.phone) {
      const byPhone = await this.leadRepository.findOne({
        where: { phone: data.phone },
      });
      if (byPhone) return byPhone;
    }

    return null;
  }

  /**
   * Create a new lead from parsed email data
   */
  private async createLeadFromParsedData(
    data: ParsedLeadData,
    email: Email,
  ): Promise<Lead> {
    const lead = this.leadRepository.create({
      firstName: data.firstName || 'Unknown',
      lastName: data.lastName || '',
      email: data.email?.toLowerCase() || '',
      phone: data.phone || '',
      source: data.source,
      externalRef: data.externalRef,
      status: LeadStatus.PENDING, // Goes to inbox queue
      contactStatus: ContactStatus.NOT_CONTACTED,
      moveDate: data.moveDate,
      fromAddress: data.fromAddress,
      fromPostcode: data.fromPostcode?.toUpperCase(),
      toAddress: data.toAddress,
      toPostcode: data.toPostcode?.toUpperCase(),
      bedrooms: data.bedrooms,
      packingRequired: data.packingRequired,
      notes: data.notes,
    });

    const savedLead = await this.leadRepository.save(lead);

    // Link the email to the lead
    email.lead = savedLead;
    await this.emailRepository.save(email);

    // Create activity for lead creation
    const activity = this.activityRepository.create({
      type: ActivityType.STATUS_CHANGE,
      description: `Lead created from ${data.source} email`,
      lead: savedLead,
    });
    await this.activityRepository.save(activity);

    return savedLead;
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    totalUnprocessed: number;
    bySource: Record<string, number>;
  }> {
    // Count unprocessed emails
    const totalUnprocessed = await this.emailRepository.count({
      where: {
        direction: EmailDirection.INBOUND,
        lead: IsNull(),
      },
    });

    // This would require a more complex query for bySource
    return {
      totalUnprocessed,
      bySource: {},
    };
  }

  /**
   * Preview what would be parsed from an email (for testing)
   */
  previewParse(from: string, subject: string, body: string): {
    parserFound: boolean;
    parserName?: string;
    result?: ParsedLeadData;
    error?: string;
  } {
    const parser = this.parserFactory.detectParser(from, subject);
    
    if (!parser) {
      return { parserFound: false, error: 'No parser found for this email' };
    }

    const result = this.parserFactory.parseEmail(from, subject, body, body);

    return {
      parserFound: true,
      parserName: parser.constructor.name,
      result: result.lead,
      error: result.error,
    };
  }
}
