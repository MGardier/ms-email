import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteEmailRequestDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
