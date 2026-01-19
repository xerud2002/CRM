import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment, Lead, EmailAccount } from '../entities';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AssessmentEmailService } from './assessment-email.service';
import { ActivitiesModule } from '../activities/activities.module';
import { MailClientModule } from '../mail-client/mail-client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assessment, Lead, EmailAccount]),
    ActivitiesModule,
    MailClientModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AssessmentEmailService],
  exports: [AssessmentsService, AssessmentEmailService],
})
export class AssessmentsModule {}
