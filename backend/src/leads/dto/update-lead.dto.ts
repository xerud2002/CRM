import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsNumber, IsBoolean, IsString, IsUrl } from 'class-validator';
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

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Xero quote link must be a valid URL' })
  xeroQuoteLink?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Xero invoice link must be a valid URL' })
  xeroInvoiceLink?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  jobDays?: { day: number; date: Date; type: 'packing' | 'loading' | 'moving' | 'unloading'; startTime?: string }[];
}
