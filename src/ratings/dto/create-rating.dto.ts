import { IsInt, IsNotEmpty, Max } from 'class-validator';

export class CreateRatingDto {
  @IsNotEmpty()
  @IsInt()
  @Max(5)
  value: number;
}
