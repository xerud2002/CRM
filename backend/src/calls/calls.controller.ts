import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CallsService } from './calls.service';
import { CreateCallDto, UpdateCallDto, CallQueryDto } from './dto/call.dto';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  /**
   * Log a new call
   */
  @Post()
  async create(
    @Body() dto: CreateCallDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.callsService.create(dto, req.user.id);
  }

  /**
   * Get all calls with filtering
   */
  @Get()
  async findAll(@Query() query: CallQueryDto) {
    return this.callsService.findAll(query);
  }

  /**
   * Get calls for a specific lead
   */
  @Get('lead/:leadId')
  async findByLead(@Param('leadId') leadId: string) {
    return this.callsService.findByLead(leadId);
  }

  /**
   * Get calls requiring follow-up
   */
  @Get('follow-ups')
  async getFollowUps() {
    return this.callsService.getFollowUps();
  }

  /**
   * Get call statistics
   */
  @Get('stats')
  async getStats() {
    return this.callsService.getStats();
  }

  /**
   * Get a single call
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.callsService.findOne(id);
  }

  /**
   * Update a call
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCallDto) {
    return this.callsService.update(id, dto);
  }

  /**
   * Delete a call
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.callsService.delete(id);
    return { success: true };
  }
}
