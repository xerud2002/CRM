import { Repository } from 'typeorm';
import { EmailAccount, Email, Lead } from '../entities';
import { SmtpService } from './smtp.service';
import { ImapService } from './imap.service';
export declare class MailClientService {
    private readonly accountRepository;
    private readonly emailRepository;
    private readonly leadRepository;
    private readonly smtpService;
    private readonly imapService;
    constructor(accountRepository: Repository<EmailAccount>, emailRepository: Repository<Email>, leadRepository: Repository<Lead>, smtpService: SmtpService, imapService: ImapService);
    getAccounts(): Promise<EmailAccount[]>;
    getInbox(accountId: string, page?: number, limit?: number): Promise<never[]>;
    sendEmail(accountId: string, to: string, subject: string, body: string, attachments?: any[]): Promise<Email>;
}
