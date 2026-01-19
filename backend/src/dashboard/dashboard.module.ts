import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Lead, Activity, Email, Call, Assessment } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Activity, Email, Call, Assessment]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
