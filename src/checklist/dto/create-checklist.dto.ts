import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChecklistDto {
  @IsNotEmpty()
  @IsString()
  item: string;
}
