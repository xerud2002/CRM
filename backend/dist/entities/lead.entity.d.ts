import { User } from './user.entity';
export declare enum LeadStatus {
    PENDING = "pending",
    NEW = "new",
    CONTACTED = "contacted",
    QUALIFIED = "qualified",
    PROPOSAL = "proposal",
    WON = "won",
    LOST = "lost",
    REJECTED = "rejected"
}
export declare enum ContactStatus {
    NOT_CONTACTED = "not_contacted",
    CONTACTED = "contacted",
    RESPONDED = "responded",
    NO_RESPONSE = "no_response"
}
export declare enum LeadSource {
    COMPAREMYMOVE = "comparemymove",
    REALLYMOVING = "reallymoving",
    GETAMOVER = "getamover",
    WEBSITE = "website",
    MANUAL = "manual"
}
export declare class Lead {
    id: string;
    assignedTo: User;
    assignedToId: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    company: string;
    status: LeadStatus;
    contactStatus: ContactStatus;
    milestones: Record<string, any>;
    source: LeadSource;
    externalRef: string;
    moveDate: Date;
    fromAddress: string;
    fromPostcode: string;
    fromPropertyType: string;
    toAddress: string;
    toPostcode: string;
    toPropertyType: string;
    bedrooms: number;
    moveCategory: string;
    distanceMiles: number;
    inventoryJson: Record<string, any>;
    packingRequired: boolean;
    cleaningRequired: boolean;
    notes: string;
    quoteAmount: number;
    quoteAccepted: boolean;
    lastContactAt: Date;
    activities: any[];
    emails: any[];
    calls: any[];
    assessments: any[];
    createdAt: Date;
    updatedAt: Date;
}
