import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAccount } from '../entities';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SmtpService {
  constructor(
    @InjectRepository(EmailAccount)
    private readonly accountRepository: Repository<EmailAccount>,
  ) {}

  async sendEmail(
    accountId: string,
    to: string,
    subject: string,
    html: string,
    attachments?: any[],
  ) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException(`Email account not found`);
    }

    // Decrypt password (placeholder for actual decryption)
    // In production, use a proper encryption service
    const password = account.passwordEncrypted;

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: account.username,
        pass: password,
      },
    });

    const mailOptions = {
      from: `"${account.displayName}" <${account.email}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  }
}
