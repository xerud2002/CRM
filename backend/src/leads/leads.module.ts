import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { AutoAssignmentService } from './auto-assignment.service';
import { Lead, Activity, User } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Activity, User])],
  controllers: [LeadsController],
  providers: [LeadsService, AutoAssignmentService],
  exports: [LeadsService, AutoAssignmentService],
})
export class LeadsModule {}
