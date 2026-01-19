import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto, SmsTemplate } from './dto/sms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  async sendSms(
    @Body() dto: SendSmsDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.smsService.sendSms(dto, req.user.id);
  }

  @Get('templates')
  getTemplates() {
    return this.smsService.getTemplates();
  }

  @Get('preview')
  getTemplatePreview(
    @Query('template') template: SmsTemplate,
    @Query('firstName') firstName?: string,
  ) {
    return {
      preview: this.smsService.getSimplePreview(template, firstName || 'John'),
    };
  }

  @Get('status')
  getStatus() {
    return {
      configured: this.smsService.isConfigured(),
    };
  }
}
