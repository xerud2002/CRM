import { MailClientService } from './mail-client.service';
export declare class MailClientController {
    private readonly mailService;
    constructor(mailService: MailClientService);
    getAccounts(): Promise<import("../entities").EmailAccount[]>;
    sendEmail(body: {
        accountId: string;
        to: string;
        subject: string;
        html: string;
    }): Promise<import("../entities").Email[]>;
}
