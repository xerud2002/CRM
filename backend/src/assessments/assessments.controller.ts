import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssessmentsService } from './assessments.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  AssessmentFilterDto,
} from './dto';
import { AssessmentType } from '../entities';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  create(@Body() dto: CreateAssessmentDto, @Request() req) {
    return this.assessmentsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() filter: AssessmentFilterDto) {
    return this.assessmentsService.findAll(filter);
  }

  @Get('calendar')
  getCalendarEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('type') type?: AssessmentType,
  ) {
    return this.assessmentsService.getCalendarEvents(startDate, endDate, type);
  }

  @Get('upcoming')
  getUpcoming(@Query('limit') limit?: number) {
    return this.assessmentsService.getUpcoming(limit);
  }

  @Get('lead/:leadId')
  getByLead(@Param('leadId') leadId: string) {
    return this.assessmentsService.getByLead(leadId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
    @Request() req,
  ) {
    return this.assessmentsService.update(id, dto, req.user.id);
  }

  @Put(':id/complete')
  complete(
    @Param('id') id: string,
    @Body('outcome') outcome: string,
    @Request() req,
  ) {
    return this.assessmentsService.completeAssessment(id, outcome, req.user.id);
  }

  @Put(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.assessmentsService.cancelAssessment(id, reason, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }
}
