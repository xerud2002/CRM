import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  Assessment,
  AssessmentStatus,
  AssessmentMethod,
  Lead,
  EmailAccount,
} from '../entities';
import { SmtpService } from '../mail-client/smtp.service';
import { IcsGenerator } from '../mail-client/ics-generator';

@Injectable()
export class AssessmentEmailService {
  private readonly logger = new Logger(AssessmentEmailService.name);

  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(EmailAccount)
    private readonly accountRepository: Repository<EmailAccount>,
    private readonly smtpService: SmtpService,
  ) {}

  /**
   * Send confirmation email when assessment is created/scheduled
   */
  async sendConfirmation(
    assessmentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const assessment = await this.assessmentRepository.findOne({
        where: { id: assessmentId },
        relations: ['lead', 'assignedTo'],
      });

      if (!assessment || !assessment.lead) {
        return { success: false, error: 'Assessment or lead not found' };
      }

      if (!assessment.lead.email) {
        return { success: false, error: 'Lead has no email address' };
      }

      const account = await this.getDefaultAccount();
      if (!account) {
        return { success: false, error: 'No email account configured' };
      }

      const html = this.generateConfirmationEmail(assessment);
      const subject = `Assessment Confirmation - ${this.formatDate(assessment.assessmentDate)} at ${assessment.assessmentTime}`;

      // Generate ICS attachment
      const icsContent = this.generateIcsForAssessment(assessment);
      const attachments = [
        {
          filename: 'assessment.ics',
          content: icsContent,
          contentType: 'text/calendar',
        },
      ];

      await this.smtpService.sendEmail(
        account.id,
        assessment.lead.email,
        subject,
        html,
        attachments,
      );

      // Mark as sent
      await this.assessmentRepository.update(assessmentId, {
        confirmationSent: true,
      });

      this.logger.log(`Confirmation sent for assessment ${assessmentId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send confirmation: ${error}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send reminder email (typically 24h before)
   */
  async sendReminder(
    assessmentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const assessment = await this.assessmentRepository.findOne({
        where: { id: assessmentId },
        relations: ['lead', 'assignedTo'],
      });

      if (!assessment || !assessment.lead) {
        return { success: false, error: 'Assessment or lead not found' };
      }

      if (!assessment.lead.email) {
        return { success: false, error: 'Lead has no email address' };
      }

      if (assessment.status !== AssessmentStatus.SCHEDULED) {
        return { success: false, error: 'Assessment is not scheduled' };
      }

      const account = await this.getDefaultAccount();
      if (!account) {
        return { success: false, error: 'No email account configured' };
      }

      const html = this.generateReminderEmail(assessment);
      const subject = `Reminder: Assessment Tomorrow - ${assessment.assessmentTime}`;

      await this.smtpService.sendEmail(
        account.id,
        assessment.lead.email,
        subject,
        html,
      );

      // Mark as sent
      await this.assessmentRepository.update(assessmentId, {
        reminderSent: true,
      });

      this.logger.log(`Reminder sent for assessment ${assessmentId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send reminder: ${error}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Find assessments needing reminders (scheduled for tomorrow, reminder not sent)
   */
  async findAssessmentsNeedingReminders(): Promise<Assessment[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return this.assessmentRepository.find({
      where: {
        assessmentDate: MoreThanOrEqual(tomorrow),
        status: AssessmentStatus.SCHEDULED,
        reminderSent: false,
      },
      relations: ['lead', 'assignedTo'],
    });
  }

  /**
   * Send all pending reminders (can be called via cron)
   */
  async sendPendingReminders(): Promise<{ sent: number; failed: number }> {
    const assessments = await this.findAssessmentsNeedingReminders();
    let sent = 0;
    let failed = 0;

    for (const assessment of assessments) {
      const result = await this.sendReminder(assessment.id);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    this.logger.log(`Sent ${sent} reminders, ${failed} failed`);
    return { sent, failed };
  }

  private async getDefaultAccount(): Promise<EmailAccount | null> {
    // Prefer office@ account, fall back to any active account
    const office = await this.accountRepository.findOne({
      where: { email: 'office@holdemremovals.co.uk', isActive: true },
    });
    if (office) return office;

    return this.accountRepository.findOne({ where: { isActive: true } });
  }

  private generateIcsForAssessment(assessment: Assessment): string {
    const leadName =
      `${assessment.lead.firstName || ''} ${assessment.lead.lastName || ''}`.trim() ||
      'Customer';
    const isVideo = [
      AssessmentMethod.WHATSAPP,
      AssessmentMethod.ZOOM,
      AssessmentMethod.PHONE,
    ].includes(assessment.method);

    // Parse time and create start date
    const [hours, minutes] = assessment.assessmentTime.split(':').map(Number);
    const startDate = new Date(assessment.assessmentDate);
    startDate.setHours(hours, minutes, 0, 0);

    const duration = assessment.estimatedDurationMins || 60;

    if (isVideo) {
      return IcsGenerator.generateVideoCallInvite({
        customerName: leadName,
        customerEmail: assessment.lead.email || '',
        customerPhone: assessment.lead.phone || '',
        assessmentDate: startDate,
        durationMinutes: duration,
        method: assessment.method as 'whatsapp' | 'zoom' | 'phone',
        staffName: assessment.assignedTo?.name,
        staffEmail:
          assessment.assignedTo?.email || 'office@holdemremovals.co.uk',
      });
    } else {
      const address = assessment.fromAddress
        ? `${assessment.fromAddress}${assessment.fromPostcode ? ', ' + assessment.fromPostcode : ''}`
        : 'TBC';

      return IcsGenerator.generateInPersonInvite({
        customerName: leadName,
        customerEmail: assessment.lead.email || '',
        address,
        assessmentDate: startDate,
        durationMinutes: duration,
        staffName: assessment.assignedTo?.name,
        staffEmail:
          assessment.assignedTo?.email || 'office@holdemremovals.co.uk',
      });
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private getMethodDescription(method: AssessmentMethod): string {
    const descriptions: Record<AssessmentMethod, string> = {
      [AssessmentMethod.WHATSAPP]: 'WhatsApp Video Call',
      [AssessmentMethod.ZOOM]: 'Zoom Video Call',
      [AssessmentMethod.PHONE]: 'Phone Call',
      [AssessmentMethod.ON_SITE]: 'On-Site Visit',
      [AssessmentMethod.OFFICE_VISIT]: 'Office Visit',
    };
    return descriptions[method] || method;
  }

  private generateConfirmationEmail(assessment: Assessment): string {
    const leadName =
      `${assessment.lead.firstName || ''} ${assessment.lead.lastName || ''}`.trim() ||
      'there';
    const methodDesc = this.getMethodDescription(assessment.method);
    const dateStr = this.formatDate(assessment.assessmentDate);
    const isVideo = [
      AssessmentMethod.WHATSAPP,
      AssessmentMethod.ZOOM,
      AssessmentMethod.PHONE,
    ].includes(assessment.method);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Assessment Confirmed</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi ${leadName},</p>
    
    <p>Thank you for booking your ${isVideo ? 'video' : 'in-person'} assessment with Holdem Removals. Here are your appointment details:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <strong style="color: #64748b;">Type:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            ${methodDesc}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <strong style="color: #64748b;">Date:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            ${dateStr}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <strong style="color: #64748b;">Time:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            ${assessment.assessmentTime}
          </td>
        </tr>
        ${
          assessment.fromAddress
            ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <strong style="color: #64748b;">From Address:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            ${assessment.fromAddress}${assessment.fromPostcode ? `, ${assessment.fromPostcode}` : ''}
          </td>
        </tr>
        `
            : ''
        }
        ${
          assessment.toAddress
            ? `
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #64748b;">To Address:</strong>
          </td>
          <td style="padding: 10px 0;">
            ${assessment.toAddress}${assessment.toPostcode ? `, ${assessment.toPostcode}` : ''}
          </td>
        </tr>
        `
            : ''
        }
      </table>
    </div>
    
    ${
      isVideo
        ? `
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
      <p style="margin: 0;"><strong>Video Call Tips:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Ensure good lighting in the rooms you'll be showing</li>
        <li>Have your phone/device charged and ready</li>
        <li>We'll call you at the scheduled time</li>
      </ul>
    </div>
    `
        : `
    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <p style="margin: 0;"><strong>What to Expect:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Our surveyor will arrive at the scheduled time</li>
        <li>The assessment typically takes 30-60 minutes</li>
        <li>You'll receive a detailed quote shortly after</li>
      </ul>
    </div>
    `
    }
    
    <p>We've attached a calendar invite (.ics file) so you can add this to your calendar.</p>
    
    <p style="margin-top: 30px;">Need to reschedule? Just reply to this email or call us at <strong>0800 XXX XXXX</strong>.</p>
    
    <p style="margin-top: 20px;">
      Best regards,<br>
      <strong>The Holdem Removals Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>Holdem Removals Ltd | Moving made simple</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateReminderEmail(assessment: Assessment): string {
    const leadName =
      `${assessment.lead.firstName || ''} ${assessment.lead.lastName || ''}`.trim() ||
      'there';
    const methodDesc = this.getMethodDescription(assessment.method);
    const dateStr = this.formatDate(assessment.assessmentDate);
    const isVideo = [
      AssessmentMethod.WHATSAPP,
      AssessmentMethod.ZOOM,
      AssessmentMethod.PHONE,
    ].includes(assessment.method);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Reminder: Assessment Tomorrow</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi ${leadName},</p>
    
    <p>Just a friendly reminder that your ${isVideo ? 'video' : 'in-person'} assessment is scheduled for <strong>tomorrow</strong>.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #fbbf24; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #64748b;">Type:</strong>
          </td>
          <td style="padding: 10px 0;">
            ${methodDesc}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #64748b;">Date:</strong>
          </td>
          <td style="padding: 10px 0;">
            <strong>${dateStr}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #64748b;">Time:</strong>
          </td>
          <td style="padding: 10px 0;">
            <strong>${assessment.assessmentTime}</strong>
          </td>
        </tr>
      </table>
    </div>
    
    ${
      isVideo
        ? `
    <p>Please make sure you're available at the scheduled time. We'll initiate the call from our end.</p>
    `
        : `
    <p>Please ensure someone is home at the scheduled time. Our surveyor will arrive promptly.</p>
    `
    }
    
    <p style="margin-top: 20px;">Need to reschedule? Please contact us as soon as possible at <strong>0800 XXX XXXX</strong>.</p>
    
    <p style="margin-top: 20px;">
      See you tomorrow!<br>
      <strong>The Holdem Removals Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>Holdem Removals Ltd | Moving made simple</p>
  </div>
</body>
</html>
    `.trim();
  }
}
