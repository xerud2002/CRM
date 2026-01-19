import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    findAll(filter: LeadFilterDto): Promise<{
        data: import("../entities").Lead[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getInbox(): Promise<import("../entities").Lead[]>;
    getInboxCount(): Promise<number>;
    findOne(id: string): Promise<import("../entities").Lead>;
    create(createLeadDto: CreateLeadDto, req: any): Promise<import("../entities").Lead>;
    update(id: string, updateLeadDto: UpdateLeadDto, req: any): Promise<import("../entities").Lead>;
    accept(id: string, req: any): Promise<import("../entities").Lead>;
    reject(id: string, req: any): Promise<import("../entities").Lead>;
    delete(id: string): Promise<import("../entities").Lead>;
}
