import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { LeadSource } from '../../entities';

export class DashboardFilterDto {
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsArray()
    postcodes?: string[];

    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @IsOptional()
    @Type(() => Date)
    dateTo?: Date;

    @IsOptional()
    @IsEnum(LeadSource)
    source?: LeadSource;

    @IsOptional()
    @IsString()
    assignedToId?: string;
}
