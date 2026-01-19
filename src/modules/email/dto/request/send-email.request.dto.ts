import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendEmailRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true, message: 'the receivers are not valid' })
  receivers: string[];

  @IsEmail()
  @IsOptional()
  sender?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true, message: 'the cc are not valid' })
  cc?: string[];

  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true, message: 'the bcc are not valid' })
  bcc?: string[];

  @IsOptional()
  @IsNumber()
  gatewayEmailId?: number;

  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, string>;

  @IsNotEmpty()
  @IsString()
  templatePath: string;
}
