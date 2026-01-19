import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ActivityType } from '../../entities';

export class CreateActivityDto {
  @IsUUID()
  leadId: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsString()
  description: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateNoteDto {
  @IsString()
  description: string;
}
