import { LeadStatus, ContactStatus, LeadSource } from '../../entities';
export declare class LeadFilterDto {
    search?: string;
    status?: LeadStatus;
    contactStatus?: ContactStatus;
    source?: LeadSource;
    postcodes?: string[];
    assignedToId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
}
