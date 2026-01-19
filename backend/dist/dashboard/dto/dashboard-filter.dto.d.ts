import { LeadSource } from '../../entities';
export declare class DashboardFilterDto {
    postcodes?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    source?: LeadSource;
    assignedToId?: string;
}
