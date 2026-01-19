import { IsOptional, IsArray, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { LeadSource } from '../../entities';

export class DashboardFilterDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  postcodes?: string[];

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  dateFrom?: Date;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  dateTo?: Date;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
