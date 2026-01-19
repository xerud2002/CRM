import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAccount, Email, EmailDirection, Lead } from '../entities';
import { SmtpService } from './smtp.service';
import { ImapService } from './imap.service';

@Injectable()
export class MailClientService {
  constructor(
    @InjectRepository(EmailAccount)
    private readonly accountRepository: Repository<EmailAccount>,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly smtpService: SmtpService,
    private readonly imapService: ImapService,
  ) {}

  async getAccounts() {
    return this.accountRepository.find({ where: { isActive: true } });
  }

  async createAccount(data: {
    email: string;
    displayName: string;
    imapHost: string;
    imapPort?: number;
    smtpHost: string;
    smtpPort?: number;
    username: string;
    password: string;
    ownerId?: string;
  }) {
    const account = this.accountRepository.create({
      email: data.email,
      displayName: data.displayName,
      imapHost: data.imapHost,
      imapPort: data.imapPort || 993,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort || 587,
      username: data.username,
      passwordEncrypted: data.password, // In production, encrypt this
      ownerId: data.ownerId,
      isActive: true,
    });
    return this.accountRepository.save(account);
  }

  async syncAccount(accountId: string) {
    return this.imapService.fetchEmails(accountId);
  }

  async syncAllAccounts() {
    const accounts = await this.accountRepository.find({
      where: { isActive: true },
    });
    const results = [];
    for (const account of accounts) {
      try {
        const emails = await this.imapService.fetchEmails(account.id);
        results.push({
          accountId: account.id,
          email: account.email,
          synced: emails.length,
        });
      } catch (error) {
        results.push({
          accountId: account.id,
          email: account.email,
          error: (error as Error).message,
        });
      }
    }
    return results;
  }

  async getInbox(accountId?: string, page = 1, limit = 50) {
    const query = this.emailRepository
      .createQueryBuilder('email')
      .leftJoinAndSelect('email.lead', 'lead')
      .orderBy('email.sentAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (accountId) {
      // Filter by account's email address
      const account = await this.accountRepository.findOne({
        where: { id: accountId },
      });
      if (account) {
        query.andWhere(
          '(email.fromAddress = :email OR email.toAddress = :email)',
          { email: account.email },
        );
      }
    }

    const [emails, total] = await query.getManyAndCount();

    return {
      data: emails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmailsByLead(leadId: string) {
    return this.emailRepository.find({
      where: { leadId },
      order: { sentAt: 'DESC' },
    });
  }

  async getEmail(id: string) {
    return this.emailRepository.findOne({
      where: { id },
      relations: ['lead'],
    });
  }

  async getFolders(accountId: string) {
    return this.imapService.getFolders(accountId);
  }

  async sendEmail(
    accountId: string,
    to: string,
    subject: string,
    body: string,
    attachments?: any[],
  ) {
    // 1. Send via SMTP
    const result = await this.smtpService.sendEmail(
      accountId,
      to,
      subject,
      body,
      attachments,
    );

    // 2. Save to DB
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      throw new Error('Email account not found');
    }

    // 3. Try to link to a lead
    const lead = await this.leadRepository.findOne({ where: { email: to } });

    const email = this.emailRepository.create({
      direction: EmailDirection.OUTBOUND,
      subject,
      body,
      fromAddress: account.email,
      toAddress: to,
      messageId: result.messageId,
      sentAt: new Date(),
      lead: lead || undefined,
    });

    return this.emailRepository.save(email);
  }
}
