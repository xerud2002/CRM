import { Repository } from 'typeorm';
import { EmailAccount } from '../entities';
export declare class SmtpService {
    private readonly accountRepository;
    constructor(accountRepository: Repository<EmailAccount>);
    sendEmail(accountId: string, to: string, subject: string, html: string, attachments?: any[]): Promise<{
        messageId: any;
        accepted: any;
        rejected: any;
    }>;
}
