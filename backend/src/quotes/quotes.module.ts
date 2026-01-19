import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote, QuoteLineItem, Lead, Activity } from '../entities';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, QuoteLineItem, Lead, Activity])],
  controllers: [QuotesController],
  providers: [QuotesService, PdfService],
  exports: [QuotesService],
})
export class QuotesModule {}
