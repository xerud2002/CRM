import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';
import {
  AssessmentType,
  AssessmentMethod,
  AssessmentStatus,
} from '../../entities';

export class CreateAssessmentDto {
  @IsUUID()
  leadId: string;

  @IsEnum(AssessmentType)
  type: AssessmentType;

  @IsDateString()
  assessmentDate: string;

  @IsString()
  assessmentTime: string; // HH:mm format

  @IsEnum(AssessmentMethod)
  method: AssessmentMethod;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  fromPostcode?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsString()
  toPostcode?: string;

  @IsOptional()
  @IsDateString()
  moveDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedDurationMins?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssessmentDto {
  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @IsOptional()
  @IsDateString()
  assessmentDate?: string;

  @IsOptional()
  @IsString()
  assessmentTime?: string;

  @IsOptional()
  @IsEnum(AssessmentMethod)
  method?: AssessmentMethod;

  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  fromPostcode?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsString()
  toPostcode?: string;

  @IsOptional()
  @IsDateString()
  moveDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedDurationMins?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outcome?: string;
}

export class AssessmentFilterDto {
  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
