import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(filter: DashboardFilterDto): Promise<{
        contactMetrics: import("./dashboard.service").ContactMetrics;
        methodBreakdown: import("./dashboard.service").MethodBreakdown;
        conversionFunnel: import("./dashboard.service").ConversionFunnel;
    }>;
    getContactMetrics(filter: DashboardFilterDto): Promise<import("./dashboard.service").ContactMetrics>;
    getConversionFunnel(filter: DashboardFilterDto): Promise<import("./dashboard.service").ConversionFunnel>;
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
}
