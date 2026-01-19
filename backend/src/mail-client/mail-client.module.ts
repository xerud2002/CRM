import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailClientController } from './mail-client.controller';
import { MailClientService } from './mail-client.service';
import { ImapService } from './imap.service';
import { SmtpService } from './smtp.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { EmailAccount, Email, EmailTemplate, Lead } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount, Email, EmailTemplate, Lead]),
  ],
  controllers: [MailClientController, TemplatesController],
  providers: [MailClientService, ImapService, SmtpService, TemplatesService],
  exports: [MailClientService, ImapService, TemplatesService],
})
export class MailClientModule {}
