import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  EmailProcessorService,
  ProcessingResult,
} from './email-processor.service';

@Controller('mail/process')
@UseGuards(JwtAuthGuard)
export class EmailProcessorController {
  constructor(private readonly processorService: EmailProcessorService) {}

  /**
   * Process all unprocessed incoming emails
   * Creates leads from parsed email content
   */
  @Post()
  async processEmails(): Promise<ProcessingResult> {
    return this.processorService.processIncomingEmails();
  }

  /**
   * Process a single email by ID
   */
  @Post(':emailId')
  async processSingleEmail(@Param('emailId') emailId: string): Promise<{
    success: boolean;
    leadId?: string;
    error?: string;
  }> {
    const result = await this.processorService.processSingleEmail(emailId);
    return {
      success: result.success,
      leadId: result.lead?.id,
      error: result.error,
    };
  }

  /**
   * Get processing statistics
   */
  @Get('stats')
  async getStats(): Promise<{
    totalUnprocessed: number;
    bySource: Record<string, number>;
  }> {
    return this.processorService.getProcessingStats();
  }

  /**
   * Preview parsing result without creating a lead
   * Useful for testing parsers
   */
  @Post('preview')
  previewParse(@Body() body: { from: string; subject: string; body: string }): {
    parserFound: boolean;
    parserName?: string;
    result?: unknown;
    error?: string;
  } {
    return this.processorService.previewParse(
      body.from,
      body.subject,
      body.body,
    );
  }
}
