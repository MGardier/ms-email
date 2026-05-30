import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class SendEmailDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true, message: 'the recipients are not valid' })
  recipients: string[];

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

  @IsString()
  @IsOptional()
  @MaxLength(500000, { message: 'HTML content exceeds maximum allowed size' })
  html?: string;

  // Required (and non-empty) whenever a template is referenced, i.e. when
  // templateSlug itself or versionNumber is provided. Skipped on the raw-HTML path.
  @ValidateIf(
    (o: SendEmailDto) =>
      o.versionNumber !== undefined || o.templateSlug !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  templateSlug?: string;

  @IsInt()
  @IsOptional()
  versionNumber?: number;

  @IsObject()
  @IsOptional()
  variables?: Record<string, unknown>;

  @IsInt()
  @IsOptional()
  userId?: number;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
