import { Lead } from './lead.entity';
export declare enum EmailDirection {
    INBOUND = "inbound",
    OUTBOUND = "outbound"
}
export declare class Email {
    id: string;
    lead: Lead;
    leadId: string;
    template: any;
    templateId: string;
    direction: EmailDirection;
    subject: string;
    body: string;
    fromAddress: string;
    toAddress: string;
    messageId: string;
    sentAt: Date;
    attachments: {
        filename: string;
        size: number;
        contentType: string;
    }[];
    createdAt: Date;
}
