import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateNoteDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user?: { id: string };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * GET /leads/:leadId/activities
   * Get all activities for a specific lead
   */
  @Get('leads/:leadId/activities')
  getLeadActivities(@Param('leadId') leadId: string) {
    return this.activitiesService.findByLead(leadId);
  }

  /**
   * POST /leads/:leadId/notes
   * Add a manual note to a lead
   */
  @Post('leads/:leadId/notes')
  addNote(
    @Param('leadId') leadId: string,
    @Body() dto: CreateNoteDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.addNote(leadId, dto, req.user?.id ?? '');
  }

  /**
   * GET /activities/recent
   * Get recent activities across all leads (for dashboard)
   */
  @Get('activities/recent')
  getRecentActivities(@Query('limit') limit?: number) {
    return this.activitiesService.getRecent(limit || 10);
  }
}
