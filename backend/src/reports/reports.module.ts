import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CsvExportService } from './csv-export.service';
import { Lead, Quote, Call, Email, Assessment } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Quote, Call, Email, Assessment])],
  controllers: [ReportsController],
  providers: [ReportsService, CsvExportService],
  exports: [ReportsService, CsvExportService],
})
export class ReportsModule {}
