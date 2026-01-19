import { LeadSource } from '../../entities';
export declare class CreateLeadDto {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    source?: LeadSource;
    externalRef?: string;
    moveDate?: Date;
    fromAddress?: string;
    fromPostcode?: string;
    fromPropertyType?: string;
    toAddress?: string;
    toPostcode?: string;
    toPropertyType?: string;
    bedrooms?: number;
    moveCategory?: string;
    distanceMiles?: number;
    inventoryJson?: Record<string, any>;
    packingRequired?: boolean;
    cleaningRequired?: boolean;
    notes?: string;
}
