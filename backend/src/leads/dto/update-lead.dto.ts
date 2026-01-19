import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { CreateLeadDto } from './create-lead.dto';
import { LeadStatus, ContactStatus } from '../../entities';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(ContactStatus)
  contactStatus?: ContactStatus;

  @IsOptional()
  @IsNumber()
  quoteAmount?: number;

  @IsOptional()
  @IsBoolean()
  quoteAccepted?: boolean;

  @IsOptional()
  assignedToId?: string;
}
