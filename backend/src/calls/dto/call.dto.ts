import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { CallDirection, CallStatus } from '../../entities';

export class CreateCallDto {
  @IsUUID()
  leadId: string;

  @IsEnum(CallDirection)
  direction: CallDirection;

  @IsEnum(CallStatus)
  @IsOptional()
  status?: CallStatus;

  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  followUpRequired?: boolean;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @IsDateString()
  @IsOptional()
  startedAt?: string;
}

export class UpdateCallDto {
  @IsEnum(CallStatus)
  @IsOptional()
  status?: CallStatus;

  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  followUpRequired?: boolean;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}

export class CallQueryDto {
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsEnum(CallDirection)
  @IsOptional()
  direction?: CallDirection;

  @IsEnum(CallStatus)
  @IsOptional()
  status?: CallStatus;

  @IsBoolean()
  @IsOptional()
  followUpRequired?: boolean;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
