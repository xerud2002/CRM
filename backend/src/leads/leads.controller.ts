import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AutoAssignmentService } from './auto-assignment.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user?: { id: string };
}

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly autoAssignmentService: AutoAssignmentService,
  ) {}

  @Get()
  findAll(@Query() filter: LeadFilterDto) {
    return this.leadsService.findAll(filter);
  }

  @Get('inbox')
  getInbox() {
    return this.leadsService.findInbox();
  }

  @Get('inbox/count')
  getInboxCount() {
    return this.leadsService.getInboxCount();
  }

  @Get('assignment/workload')
  getWorkload() {
    return this.autoAssignmentService.getStaffWorkload();
  }

  @Get('assignment/rules')
  getAssignmentRules() {
    return this.autoAssignmentService.getRules();
  }

  @Post('assignment/rules')
  addAssignmentRule(
    @Body()
    rule: {
      name: string;
      conditions: Record<string, unknown>;
      assignToUserId: string;
      priority: number;
      enabled: boolean;
    },
  ) {
    return this.autoAssignmentService.addRule(rule);
  }

  @Patch('assignment/rules/:id')
  updateAssignmentRule(
    @Param('id') id: string,
    @Body()
    updates: Partial<{
      name: string;
      conditions: Record<string, unknown>;
      assignToUserId: string;
      priority: number;
      enabled: boolean;
    }>,
  ) {
    return this.autoAssignmentService.updateRule(id, updates);
  }

  @Delete('assignment/rules/:id')
  deleteAssignmentRule(@Param('id') id: string) {
    return this.autoAssignmentService.deleteRule(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  create(
    @Body() createLeadDto: CreateLeadDto,
    @Request() req: RequestWithUser,
  ) {
    return this.leadsService.create(createLeadDto, req.user?.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: RequestWithUser,
  ) {
    return this.leadsService.update(id, updateLeadDto, req.user?.id);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string, @Request() req: RequestWithUser) {
    const lead = await this.leadsService.accept(id, req.user?.id);
    // Auto-assign on accept
    const assignedLead = await this.autoAssignmentService.assignLead(lead);
    return assignedLead || lead;
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.leadsService.reject(id, req.user?.id);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.autoAssignmentService.manualAssign(id, userId, req.user?.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.leadsService.delete(id);
  }
}
