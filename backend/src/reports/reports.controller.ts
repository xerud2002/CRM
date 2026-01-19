import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@Query() filter: ReportFilterDto) {
    return this.reportsService.getSummary(filter);
  }

  @Get('leads/by-source')
  getLeadsBySource(@Query() filter: ReportFilterDto) {
    return this.reportsService.getLeadsBySource(filter);
  }

  @Get('leads/by-status')
  getLeadsByStatus(@Query() filter: ReportFilterDto) {
    return this.reportsService.getLeadsByStatus(filter);
  }

  @Get('leads/trend')
  getLeadsTrend(@Query() filter: ReportFilterDto) {
    return this.reportsService.getLeadsTrend(filter);
  }

  @Get('revenue')
  getRevenueReport(@Query() filter: ReportFilterDto) {
    return this.reportsService.getRevenueReport(filter);
  }

  @Get('activity')
  getActivityReport(@Query() filter: ReportFilterDto) {
    return this.reportsService.getActivityReport(filter);
  }

  @Get('funnel')
  getConversionFunnel(@Query() filter: ReportFilterDto) {
    return this.reportsService.getConversionFunnel(filter);
  }

  @Get('staff-performance')
  getStaffPerformance(@Query() filter: ReportFilterDto) {
    return this.reportsService.getStaffPerformance(filter);
  }

  @Get('locations')
  getLocationAnalysis(@Query() filter: ReportFilterDto) {
    return this.reportsService.getLocationAnalysis(filter);
  }
}
