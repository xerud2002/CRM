import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailClientController } from './mail-client.controller';
import { MailClientService } from './mail-client.service';
import { ImapService } from './imap.service';
import { SmtpService } from './smtp.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { ThunderbirdImportController } from './thunderbird-import.controller';
import { ThunderbirdImportService } from './thunderbird-import.service';
import { EmailAccount, Email, EmailTemplate, Lead } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount, Email, EmailTemplate, Lead]),
  ],
  controllers: [MailClientController, TemplatesController, ThunderbirdImportController],
  providers: [MailClientService, ImapService, SmtpService, TemplatesService, ThunderbirdImportService],
  exports: [MailClientService, ImapService, TemplatesService, ThunderbirdImportService],
})
export class MailClientModule {}
