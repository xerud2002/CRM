import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteStatus } from '../../entities';

export class CreateQuoteLineItemDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateQuoteDto {
  @IsString()
  leadId: string;

  @IsOptional()
  @IsDateString()
  moveDate?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineItemDto)
  lineItems: CreateQuoteLineItemDto[];

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @IsOptional()
  @IsDateString()
  moveDate?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineItemDto)
  lineItems?: CreateQuoteLineItemDto[];

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class QuoteFilterDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
