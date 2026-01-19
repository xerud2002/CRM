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
import { EmailProcessorController } from './email-processor.controller';
import { EmailProcessorService } from './email-processor.service';
import { EmailParserFactory } from '../emails/parsers';
import { EmailAccount, Email, EmailTemplate, Lead, Activity } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount, Email, EmailTemplate, Lead, Activity]),
  ],
  controllers: [
    MailClientController,
    TemplatesController,
    ThunderbirdImportController,
    EmailProcessorController,
  ],
  providers: [
    MailClientService,
    ImapService,
    SmtpService,
    TemplatesService,
    ThunderbirdImportService,
    EmailProcessorService,
    EmailParserFactory,
  ],
  exports: [
    MailClientService,
    ImapService,
    TemplatesService,
    ThunderbirdImportService,
    EmailProcessorService,
  ],
})
export class MailClientModule {}
