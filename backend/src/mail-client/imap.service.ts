import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAccount, Email, EmailDirection, Lead } from '../entities';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const Imap = require('imap-simple');
import { simpleParser, Source } from 'mailparser';

export interface ParsedEmail {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  htmlBody?: string;
  attachments?: { filename: string; size: number; contentType: string }[];
}

interface ImapMessage {
  parts: { which: string; body: unknown }[];
  attributes: { uid: number; flags: string[] };
}

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  constructor(
    @InjectRepository(EmailAccount)
    private readonly accountRepository: Repository<EmailAccount>,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  async fetchEmails(
    accountId: string,
    folder = 'INBOX',
    limit = 50,
  ): Promise<Email[]> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      this.logger.error(`Account ${accountId} not found`);
      return [];
    }

    this.logger.log(`Fetching emails for ${account.email} from ${folder}...`);

    const config = {
      imap: {
        user: account.username,
        password: account.passwordEncrypted, // In production, decrypt this
        host: account.imapHost,
        port: account.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };

    let connection: unknown = null;
    const savedEmails: Email[] = [];

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      connection = await Imap.connect(config);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await (connection as any).openBox(folder);

      // Search for recent emails (last 7 days or since last sync)
      const searchDate = account.lastSyncAt
        ? account.lastSyncAt
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const searchCriteria = [['SINCE', searchDate]];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const messages: ImapMessage[] = await (connection as any).search(
        searchCriteria,
        fetchOptions,
      );
      this.logger.log(`Found ${messages.length} messages`);

      // Process only the most recent ones
      const recentMessages = messages.slice(-limit);

      for (const message of recentMessages) {
        try {
          const all = message.parts.find((p) => p.which === '');
          if (!all) continue;

          const parsed = await simpleParser(all.body as Source);
          const messageId =
            parsed.messageId || `${Date.now()}-${Math.random()}`;

          // Check if already exists
          const existing = await this.emailRepository.findOne({
            where: { messageId },
          });
          if (existing) continue;

          // Try to match to a lead
          const fromEmail = this.extractEmail(parsed.from?.text || '');
          const toEmail = this.extractEmail(parsed.to?.text || '');

          let lead = await this.leadRepository.findOne({
            where: { email: fromEmail },
          });
          if (!lead) {
            lead = await this.leadRepository.findOne({
              where: { email: toEmail },
            });
          }

          const email = this.emailRepository.create({
            messageId,
            subject: parsed.subject || '(No Subject)',
            body: parsed.text || '',
            fromAddress: fromEmail || parsed.from?.text || '',
            toAddress: toEmail || parsed.to?.text || '',
            direction:
              fromEmail === account.email
                ? EmailDirection.OUTBOUND
                : EmailDirection.INBOUND,
            sentAt: parsed.date || new Date(),
            lead: lead || undefined,
            attachments: parsed.attachments?.map((a) => ({
              filename: a.filename || 'attachment',
              size: a.size || 0,
              contentType: a.contentType || 'application/octet-stream',
            })),
          });

          const saved = await this.emailRepository.save(email);
          savedEmails.push(saved);
        } catch (parseError) {
          this.logger.error(
            `Error parsing message: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          );
        }
      }

      // Update last sync time
      account.lastSyncAt = new Date();
      await this.accountRepository.save(account);

      this.logger.log(`Saved ${savedEmails.length} new emails`);
    } catch (error) {
      this.logger.error(
        `IMAP error for ${account.email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      if (connection) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (connection as any).end();
      }
    }

    return savedEmails;
  }

  async getFolders(accountId: string): Promise<string[]> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) return [];

    const config = {
      imap: {
        user: account.username,
        password: account.passwordEncrypted,
        host: account.imapHost,
        port: account.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      },
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const connection = await Imap.connect(config);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const boxes: Record<string, unknown> = await connection.getBoxes();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      connection.end();
      return Object.keys(boxes);
    } catch (error) {
      this.logger.error(`Error getting folders: ${(error as Error).message}`);
      return ['INBOX', 'Sent', 'Trash', 'Drafts'];
    }
  }

  private extractEmail(text: string): string {
    const match = text.match(/<([^>]+)>/) || text.match(/([^\s<]+@[^\s>]+)/);
    return match ? match[1].toLowerCase() : text.toLowerCase();
  }
}
