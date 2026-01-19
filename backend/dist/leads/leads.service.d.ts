import { Repository } from 'typeorm';
import { Lead, Activity } from '../entities';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
export declare class LeadsService {
    private readonly leadRepository;
    private readonly activityRepository;
    constructor(leadRepository: Repository<Lead>, activityRepository: Repository<Activity>);
    findAll(filter: LeadFilterDto): Promise<{
        data: Lead[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findInbox(): Promise<Lead[]>;
    getInboxCount(): Promise<number>;
    findOne(id: string): Promise<Lead>;
    create(createLeadDto: CreateLeadDto, userId?: string): Promise<Lead>;
    update(id: string, updateLeadDto: UpdateLeadDto, userId?: string): Promise<Lead>;
    accept(id: string, userId?: string): Promise<Lead>;
    reject(id: string, userId?: string): Promise<Lead>;
    delete(id: string): Promise<Lead>;
    private logActivity;
}
