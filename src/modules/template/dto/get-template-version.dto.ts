import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTemplateVersionDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id: number;
}
