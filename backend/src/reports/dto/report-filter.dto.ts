import {
  IsOptional,
  IsDateString,
  IsString,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReportPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export class ReportFilterDto {
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }): string[] =>
    typeof value === 'string' ? value.split(',') : (value as string[]),
  )
  postcodes?: string[];

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
