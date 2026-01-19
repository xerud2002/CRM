import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, Activity, ActivityType } from '../entities';
import { SendSmsDto, SmsTemplate } from './dto/sms.dto';

interface TwilioClient {
  messages: {
    create(params: {
      body: string;
      from: string;
      to: string;
    }): Promise<{ sid: string }>;
  };
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

@Injectable()
export class SmsService {
  private twilioClient: TwilioClient | null = null;
  private fromNumber = '';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {
    void this.initializeTwilio();
  }

  private async initializeTwilio(): Promise<void> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber =
      this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (accountSid && authToken) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const twilio = require('twilio') as (
          sid: string,
          token: string,
        ) => TwilioClient;
        this.twilioClient = twilio(accountSid, authToken);
      } catch {
        console.warn(
          'Twilio package not installed. SMS sending will be simulated.',
        );
      }
    } else {
      console.warn(
        'Twilio credentials not configured. SMS sending will be simulated.',
      );
    }
  }

  async sendSms(
    dto: SendSmsDto,
    userId: string,
  ): Promise<SmsResult & { lead?: Lead }> {
    const lead = await this.leadRepository.findOne({
      where: { id: dto.leadId },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const phoneNumber = dto.to || lead.phone;
    if (!phoneNumber) {
      throw new BadRequestException('No phone number available');
    }

    let message = dto.message;
    if (dto.template && dto.template !== SmsTemplate.CUSTOM) {
      message = this.fillTemplate(dto.template, lead);
    }

    if (!message) {
      throw new BadRequestException('Message content is required');
    }

    let result: SmsResult;

    if (this.twilioClient && this.fromNumber) {
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
      } catch (error) {
        const err = error as Error;
        result = {
          success: false,
          error: err.message || 'Failed to send SMS',
        };
      }
    } else {
      console.log(`[SIMULATED SMS] To: ${phoneNumber}, Message: ${message}`);
      result = {
        success: true,
        messageId: `sim_${Date.now()}`,
        simulated: true,
      };
    }

    await this.activityRepository.save({
      leadId: dto.leadId,
      userId,
      type: ActivityType.SMS,
      description: result.success
        ? `SMS sent to ${phoneNumber}`
        : `Failed to send SMS: ${result.error}`,
      metadata: {
        template: dto.template,
        phoneNumber,
        messagePreview: message.substring(0, 100),
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        simulated: result.simulated,
      },
    });

    return { ...result, lead };
  }

  private fillTemplate(template: SmsTemplate, lead: Lead): string {
    const templates: Record<SmsTemplate, string> = {
      [SmsTemplate.APPOINTMENT_REMINDER]:
        'Hi {{firstName}}, reminder: your assessment is scheduled for {{date}}. Reply YES to confirm. - Holdem Removals',
      [SmsTemplate.QUOTE_FOLLOW_UP]:
        'Hi {{firstName}}, we sent you a quote for your move. Any questions? Call us on 01onal or reply to this message. - Holdem Removals',
      [SmsTemplate.BOOKING_CONFIRMATION]:
        'Hi {{firstName}}, your move on {{moveDate}} is confirmed! Our team will arrive at {{startTime}}. - Holdem Removals',
      [SmsTemplate.CUSTOM]: '',
    };

    const content = templates[template] || '';
    return content
      .replace(/\{\{firstName\}\}/g, lead.firstName || 'Customer')
      .replace(
        /\{\{fullName\}\}/g,
        `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Customer',
      )
      .replace(/\{\{fromPostcode\}\}/g, lead.fromPostcode || '')
      .replace(/\{\{toPostcode\}\}/g, lead.toPostcode || '')
      .replace(
        /\{\{moveDate\}\}/g,
        lead.moveDate
          ? new Date(lead.moveDate).toLocaleDateString('en-GB')
          : 'TBC',
      )
      .replace(
        /\{\{date\}\}/g,
        lead.moveDate
          ? new Date(lead.moveDate).toLocaleDateString('en-GB')
          : 'TBC',
      )
      .replace(/\{\{startTime\}\}/g, lead.startTime || 'morning');
  }

  getTemplates(): Array<{ id: string; name: string; content: string }> {
    return Object.entries(SmsTemplate)
      .filter(([key]) => key !== 'CUSTOM')
      .map(([key, value]) => ({
        id: value,
        name: key.replace(/_/g, ' ').toLowerCase(),
        content: this.getTemplatePreview(value),
      }));
  }

  private getTemplatePreview(template: SmsTemplate): string {
    const previews: Record<SmsTemplate, string> = {
      [SmsTemplate.APPOINTMENT_REMINDER]:
        'Hi {{firstName}}, reminder: your assessment is scheduled...',
      [SmsTemplate.QUOTE_FOLLOW_UP]:
        'Hi {{firstName}}, we sent you a quote for your move...',
      [SmsTemplate.BOOKING_CONFIRMATION]:
        'Hi {{firstName}}, your move on {{moveDate}} is confirmed...',
      [SmsTemplate.CUSTOM]: 'Custom message',
    };
    return previews[template] || '';
  }

  async previewSms(leadId: string, template: SmsTemplate): Promise<string> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return this.fillTemplate(template, lead);
  }

  isConfigured(): boolean {
    return this.twilioClient !== null && this.fromNumber !== '';
  }
}
