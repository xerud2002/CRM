import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailClientController } from './mail-client.controller';
import { MailClientService } from './mail-client.service';
import { ImapService } from './imap.service';
import { SmtpService } from './smtp.service';
import { EmailAccount, Email, Lead } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([EmailAccount, Email, Lead])],
  controllers: [MailClientController],
  providers: [MailClientService, ImapService, SmtpService],
  exports: [MailClientService, ImapService],
})
export class MailClientModule {}
