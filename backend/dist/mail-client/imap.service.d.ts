import { Repository } from 'typeorm';
import { EmailAccount } from '../entities';
export declare class ImapService {
    private readonly accountRepository;
    private readonly logger;
    constructor(accountRepository: Repository<EmailAccount>);
    fetchEmails(accountId: string): Promise<never[] | undefined>;
    getFolders(accountId: string): Promise<string[]>;
}
