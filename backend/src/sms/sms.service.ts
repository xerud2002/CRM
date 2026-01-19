import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Lead, Activity, ActivityType } from '../entities';
import { SendSmsDto, SmsTemplate } from './dto/sms.dto';

// SMS templates with variable placeholders
const SMS_TEMPLATES = {
  [SmsTemplate.APPOINTMENT_REMINDER]: `Hi {{firstName}}, this is a reminder of your survey appointment with Holdem Removals on {{date}} at {{time}}. Reply YES to confirm or call us on 01onal if you need to reschedule.`,
  [SmsTemplate.QUOTE_FOLLOW_UP]: `Hi {{firstName}}, we sent you a quote for your move from {{fromPostcode}} to {{toPostcode}}. Any questions? Reply to this message or call us on 01onal. - Holdem Removals`,
  [SmsTemplate.BOOKING_CONFIRMATION]: `Hi {{firstName}}, your move with Holdem Removals is confirmed for {{date}}. Our team will arrive at {{time}}. If you have any questions, call us on 01onal.`,
  [SmsTemplate.CUSTOM]: '',
};

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private twilioClient: any = null;
  private fromNumber: string;
  private isConfigured: boolean = false;

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    private readonly configService: ConfigService,
  ) {
    this.initializeTwilio();
  }

  private async initializeTwilio() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (accountSid && authToken && this.fromNumber) {
      try {
        const twilio = await import('twilio');
        this.twilioClient = twilio.default(accountSid, authToken);
        this.isConfigured = true;
        console.log('Twilio SMS service initialized');
      } catch (error) {
        console.warn('Twilio package not installed. SMS sending will be simulated.');
      }
    } else {
      console.warn('Twilio credentials not configured. SMS sending will be simulated.');
    }
  }

  async sendSms(dto: SendSmsDto, userId: string): Promise<SmsResult> {
    const lead = await this.leadRepository.findOne({
      where: { id: dto.leadId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (!lead.phone) {
      throw new BadRequestException('Lead has no phone number');
    }

    // Format phone number for UK
    let phoneNumber = lead.phone.replace(/\s+/g, '').replace(/^0/, '+44');
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+44' + phoneNumber;
    }

    // Process message with template variables
    let message = dto.message;
    if (dto.template && dto.template !== SmsTemplate.CUSTOM) {
      message = this.processTemplate(SMS_TEMPLATES[dto.template], lead);
    } else {
      message = this.processTemplate(message, lead);
    }

    let result: SmsResult;

    if (this.isConfigured && this.twilioClient) {
      try {
        const twilioResult = await this.twilioClient.messages.create({
          body: message,
          from: this.fromNumber,
          to: phoneNumber,
        });

        result = {
          success: true,
          messageId: twilioResult.sid,
        };
      } catch (error: any) {
        result = {
          success: false,
          error: error.message || 'Failed to send SMS',
        };
      }
    } else {
      // Simulate SMS sending for demo/development
      console.log(`[SMS SIMULATION] To: ${phoneNumber}, Message: ${message}`);
      result = {
        success: true,
        messageId: `sim_${Date.now()}`,
      };
    }

    // Log activity
    await this.activityRepository.save({
      type: ActivityType.NOTE,
      description: result.success 
        ? `SMS sent: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`
        : `SMS failed: ${result.error}`,
      leadId: dto.leadId,
      userId,
      metadata: {
        type: 'sms',
        direction: 'outbound',
        template: dto.template,
        phoneNumber,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      },
    });

    return result;
  }

  private processTemplate(template: string, lead: Lead): string {
    return template
      .replace(/\{\{firstName\}\}/g, lead.firstName || 'there')
      .replace(/\{\{lastName\}\}/g, lead.lastName || '')
      .replace(/\{\{fullName\}\}/g, `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Customer')
      .replace(/\{\{fromPostcode\}\}/g, lead.fromPostcode || '')
      .replace(/\{\{toPostcode\}\}/g, lead.toPostcode || '')
      .replace(/\{\{fromAddress\}\}/g, lead.fromAddress || '')
      .replace(/\{\{toAddress\}\}/g, lead.toAddress || '')
      .replace(/\{\{moveDate\}\}/g, lead.moveDate ? new Date(lead.moveDate).toLocaleDateString('en-GB') : 'TBC')
      .replace(/\{\{date\}\}/g, lead.moveDate ? new Date(lead.moveDate).toLocaleDateString('en-GB') : 'TBC')
      .replace(/\{\{time\}\}/g, '8:00 AM'); // Default time, could be made dynamic
  }

  getTemplates() {
    return Object.entries(SMS_TEMPLATES)
      .filter(([key]) => key !== SmsTemplate.CUSTOM)
      .map(([key, content]) => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        content,
        variables: this.extractVariables(content),
      }));
  }

  private extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  }

  previewSms(template: SmsTemplate, lead: Partial<Lead>): string {
    const templateContent = SMS_TEMPLATES[template] || '';
    return this.processTemplate(templateContent, lead as Lead);
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      fromNumber: this.isConfigured ? this.fromNumber : null,
      provider: 'twilio',
    };
  }
}
