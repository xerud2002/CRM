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
    ) { }

    async getAccounts() {
        return this.accountRepository.find({ where: { isActive: true } });
    }

    async getInbox(accountId: string, page = 1, limit = 20) {
        // Get emails from DB for this account (or fetch from IMAP if needed)
        // For now, we return DB stored emails linked to this account context
        // In a full email client, we'd query the 'emails' table filtering by relevant metadata
        return [];
    }

    async sendEmail(accountId: string, to: string, subject: string, body: string, attachments?: any[]) {
        // 1. Send via SMTP
        const result = await this.smtpService.sendEmail(accountId, to, subject, body, attachments);

        // 2. Save to DB
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
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
