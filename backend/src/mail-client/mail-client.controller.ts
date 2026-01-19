import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MailClientService } from './mail-client.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mail')
@UseGuards(JwtAuthGuard)
export class MailClientController {
    constructor(private readonly mailService: MailClientService) { }

    @Get('accounts')
    getAccounts() {
        return this.mailService.getAccounts();
    }

    @Post('send')
    sendEmail(@Body() body: { accountId: string; to: string; subject: string; html: string }) {
        return this.mailService.sendEmail(body.accountId, body.to, body.subject, body.html);
    }

    // More endpoints for folders, messages, etc.
}
