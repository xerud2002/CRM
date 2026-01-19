import { IsEmail, IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { LeadSource } from '../../entities';

export class CreateLeadDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsOptional()
    @IsEnum(LeadSource)
    source?: LeadSource;

    @IsOptional()
    @IsString()
    externalRef?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    moveDate?: Date;

    @IsOptional()
    @IsString()
    fromAddress?: string;

    @IsOptional()
    @IsString()
    fromPostcode?: string;

    @IsOptional()
    @IsString()
    fromPropertyType?: string;

    @IsOptional()
    @IsString()
    toAddress?: string;

    @IsOptional()
    @IsString()
    toPostcode?: string;

    @IsOptional()
    @IsString()
    toPropertyType?: string;

    @IsOptional()
    @IsNumber()
    bedrooms?: number;

    @IsOptional()
    @IsString()
    moveCategory?: string;

    @IsOptional()
    @IsNumber()
    distanceMiles?: number;

    @IsOptional()
    inventoryJson?: Record<string, any>;

    @IsOptional()
    @IsBoolean()
    packingRequired?: boolean;

    @IsOptional()
    @IsBoolean()
    cleaningRequired?: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}
