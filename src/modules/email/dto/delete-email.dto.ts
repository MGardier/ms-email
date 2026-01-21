import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteEmailDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
