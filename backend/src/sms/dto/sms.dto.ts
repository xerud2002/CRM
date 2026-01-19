import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum SmsTemplate {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  QUOTE_FOLLOW_UP = 'quote_follow_up',
  BOOKING_CONFIRMATION = 'booking_confirmation',
  CUSTOM = 'custom',
}

export class SendSmsDto {
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsEnum(SmsTemplate)
  template?: SmsTemplate;
}

export class SmsTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
