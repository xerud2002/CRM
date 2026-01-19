import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MailClientService } from './mail-client.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mail')
@UseGuards(JwtAuthGuard)
export class MailClientController {
  constructor(private readonly mailService: MailClientService) {}

  @Get('accounts')
  getAccounts() {
    return this.mailService.getAccounts();
  }

  @Post('accounts')
  createAccount(
    @Body()
    body: {
      email: string;
      displayName: string;
      imapHost: string;
      imapPort?: number;
      smtpHost: string;
      smtpPort?: number;
      username: string;
      password: string;
    },
  ) {
    return this.mailService.createAccount(body);
  }

  @Post('accounts/:id/sync')
  syncAccount(@Param('id') id: string) {
    return this.mailService.syncAccount(id);
  }

  @Post('sync-all')
  syncAllAccounts() {
    return this.mailService.syncAllAccounts();
  }

  @Get('inbox')
  getInbox(
    @Query('accountId') accountId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.mailService.getInbox(accountId, page || 1, limit || 50);
  }

  @Get('emails/:id')
  getEmail(@Param('id') id: string) {
    return this.mailService.getEmail(id);
  }

  @Get('leads/:leadId/emails')
  getEmailsByLead(@Param('leadId') leadId: string) {
    return this.mailService.getEmailsByLead(leadId);
  }

  @Get('accounts/:id/folders')
  getFolders(@Param('id') id: string) {
    return this.mailService.getFolders(id);
  }

  @Post('send')
  sendEmail(
    @Body()
    body: {
      accountId: string;
      to: string;
      subject: string;
      html: string;
    },
  ) {
    return this.mailService.sendEmail(
      body.accountId,
      body.to,
      body.subject,
      body.html,
    );
  }
}
