import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteEmailDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
