import { EmailStatus } from '@prisma/client';

export class UpdateEmailDto {
  status?: EmailStatus;
  sendAt?: Date;
}
