import { Repository } from 'typeorm';
import { Lead, Activity, Email, Call, Assessment } from '../entities';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
export interface ContactMetrics {
    totalLeads: number;
    contacted: number;
    contactedPercent: number;
    responded: number;
    respondedPercent: number;
    noResponse: number;
    noResponsePercent: number;
}
export interface MethodBreakdown {
    emailsSent: number;
    emailsResponded: number;
    emailResponseRate: number;
    callsMade: number;
    callsAnswered: number;
    callAnswerRate: number;
}
export interface ConversionFunnel {
    totalLeads: number;
    surveyBooked: number;
    surveyBookedPercent: number;
    surveyCompleted: number;
    surveyCompletedPercent: number;
    quoteSent: number;
    quoteSentPercent: number;
    quoteAccepted: number;
    quoteAcceptedPercent: number;
}
export declare class DashboardService {
    private readonly leadRepository;
    private readonly activityRepository;
    private readonly emailRepository;
    private readonly callRepository;
    private readonly assessmentRepository;
    constructor(leadRepository: Repository<Lead>, activityRepository: Repository<Activity>, emailRepository: Repository<Email>, callRepository: Repository<Call>, assessmentRepository: Repository<Assessment>);
    getOverview(filter: DashboardFilterDto): Promise<{
        contactMetrics: ContactMetrics;
        methodBreakdown: MethodBreakdown;
        conversionFunnel: ConversionFunnel;
    }>;
    getContactMetrics(filter: DashboardFilterDto): Promise<ContactMetrics>;
    getMethodBreakdown(filter: DashboardFilterDto): Promise<MethodBreakdown>;
    getConversionFunnel(filter: DashboardFilterDto): Promise<ConversionFunnel>;
    getByLocation(filter: DashboardFilterDto): Promise<{
        error: string;
    } | {
        surveyBooked: number;
        quoteAccepted: number;
        totalLeads: number;
        contacted: number;
        contactedPercent: number;
        responded: number;
        respondedPercent: number;
        noResponse: number;
        noResponsePercent: number;
        postcodes: string[];
        error?: undefined;
    }>;
    private applyFilters;
}
