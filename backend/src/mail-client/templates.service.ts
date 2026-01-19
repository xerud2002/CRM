import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, Lead } from '../entities';

export interface TemplateVariables {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  from_address?: string;
  from_postcode?: string;
  to_address?: string;
  to_postcode?: string;
  move_date?: string;
  bedrooms?: string;
  quote_amount?: string;
  assessment_date?: string;
  assessment_time?: string;
  assessment_method?: string;
  staff_name?: string;
  staff_phone?: string;
  staff_email?: string;
  company_name?: string;
  booking_link?: string;
  google_review_link?: string;
  trustpilot_review_link?: string;
}

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
  ) {}

  async findAll(category?: string): Promise<EmailTemplate[]> {
    const query = this.templateRepository
      .createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    return query
      .orderBy('template.category', 'ASC')
      .addOrderBy('template.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async create(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const template = this.templateRepository.create(data);
    return this.templateRepository.save(template);
  }

  async update(
    id: string,
    data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, data);
    return this.templateRepository.save(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  /**
   * Replace template variables with actual values from lead data
   */
  substituteVariables(text: string, variables: TemplateVariables): string {
    let result = text;

    // Replace all {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      result = result.replace(pattern, String(value || ''));
    }

    return result;
  }

  /**
   * Extract variables from lead entity
   */
  extractVariablesFromLead(
    lead: Lead,
    staffInfo?: { name: string; phone: string; email: string },
  ): TemplateVariables {
    const moveDate = lead.moveDate
      ? new Date(lead.moveDate).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

    return {
      first_name: lead.firstName || '',
      last_name: lead.lastName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      from_address: lead.fromAddress || '',
      from_postcode: lead.fromPostcode || '',
      to_address: lead.toAddress || '',
      to_postcode: lead.toPostcode || '',
      move_date: moveDate,
      bedrooms: lead.bedrooms?.toString() || '',
      staff_name: staffInfo?.name || 'Holdem Removals Team',
      staff_phone: staffInfo?.phone || '01234 567890',
      staff_email: staffInfo?.email || 'office@holdemremovals.co.uk',
      company_name: 'Holdem Removals',
      google_review_link: 'https://g.page/r/holdemremovals/review',
      trustpilot_review_link:
        'https://uk.trustpilot.com/review/holdemremovals.co.uk',
    };
  }

  /**
   * Preview template with lead data
   */
  async previewWithLead(
    templateId: string,
    lead: Lead,
    additionalVars?: Partial<TemplateVariables>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.findOne(templateId);
    const variables = {
      ...this.extractVariablesFromLead(lead),
      ...additionalVars,
    };

    return {
      subject: this.substituteVariables(template.subject, variables),
      body: this.substituteVariables(template.body, variables),
    };
  }

  /**
   * Get list of available variables for documentation
   */
  getAvailableVariables(): { name: string; description: string }[] {
    return [
      { name: 'first_name', description: 'Customer first name' },
      { name: 'last_name', description: 'Customer last name' },
      { name: 'email', description: 'Customer email' },
      { name: 'phone', description: 'Customer phone number' },
      { name: 'from_address', description: 'Moving from address' },
      { name: 'from_postcode', description: 'Moving from postcode' },
      { name: 'to_address', description: 'Moving to address' },
      { name: 'to_postcode', description: 'Moving to postcode' },
      { name: 'move_date', description: 'Moving date' },
      { name: 'bedrooms', description: 'Number of bedrooms' },
      { name: 'quote_amount', description: 'Quote amount (£)' },
      { name: 'assessment_date', description: 'Assessment/survey date' },
      { name: 'assessment_time', description: 'Assessment/survey time' },
      {
        name: 'assessment_method',
        description: 'Assessment method (WhatsApp/Zoom/On-site)',
      },
      { name: 'staff_name', description: 'Staff member name' },
      { name: 'staff_phone', description: 'Staff phone number' },
      { name: 'staff_email', description: 'Staff email' },
      { name: 'company_name', description: 'Company name' },
      { name: 'booking_link', description: 'Booking/scheduling link' },
      { name: 'google_review_link', description: 'Google review link' },
      { name: 'trustpilot_review_link', description: 'Trustpilot review link' },
    ];
  }
}
