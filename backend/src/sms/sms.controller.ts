import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto, SmsTemplate } from './dto/sms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  async sendSms(@Body() dto: SendSmsDto, @Request() req: any) {
    return this.smsService.sendSms(dto, req.user.id);
  }

  @Get('templates')
  getTemplates() {
    return this.smsService.getTemplates();
  }

  @Get('preview')
  previewSms(
    @Query('template') template: SmsTemplate,
    @Query('firstName') firstName?: string,
    @Query('fromPostcode') fromPostcode?: string,
    @Query('toPostcode') toPostcode?: string,
  ) {
    return {
      preview: this.smsService.previewSms(template, {
        firstName: firstName || 'John',
        fromPostcode: fromPostcode || 'NN1 1AA',
        toPostcode: toPostcode || 'MK1 1BB',
      }),
    };
  }

  @Get('status')
  getStatus() {
    return this.smsService.getStatus();
  }
}
