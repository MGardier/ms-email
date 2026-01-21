import { EmailStatus } from '@prisma/client';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEmailDto {
  @IsEnum(EmailStatus)
  @IsOptional()
  status?: EmailStatus;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  sendAt?: Date;
}
