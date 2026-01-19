import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { CsvExportService } from './csv-export.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly csvExportService: CsvExportService,
  ) {}

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

  // CSV Export Endpoints
  @Get('export/leads')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="leads-export.csv"')
  async exportLeads(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const csv = await this.csvExportService.exportLeads(filter);
    res.send(csv);
  }

  @Get('export/quotes')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="quotes-export.csv"')
  async exportQuotes(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const csv = await this.csvExportService.exportQuotes(filter);
    res.send(csv);
  }

  @Get('export/calls')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="calls-export.csv"')
  async exportCalls(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const csv = await this.csvExportService.exportCalls(filter);
    res.send(csv);
  }

  @Get('export/assessments')
  @Header('Content-Type', 'text/csv')
  @Header(
    'Content-Disposition',
    'attachment; filename="assessments-export.csv"',
  )
  async exportAssessments(
    @Query() filter: ReportFilterDto,
    @Res() res: Response,
  ) {
    const csv = await this.csvExportService.exportAssessments(filter);
    res.send(csv);
  }

  @Get('export/summary')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="summary-export.csv"')
  async exportSummary(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const csv = await this.csvExportService.exportSummary(filter);
    res.send(csv);
  }
}
