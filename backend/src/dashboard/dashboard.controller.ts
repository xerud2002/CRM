import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getOverview(filter);
  }

  @Get('contact-metrics')
  getContactMetrics(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getContactMetrics(filter);
  }

  @Get('conversion-funnel')
  getConversionFunnel(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getConversionFunnel(filter);
  }

  @Get('by-location')
  getByLocation(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getByLocation(filter);
  }
}
