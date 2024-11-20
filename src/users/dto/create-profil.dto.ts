import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;
  @IsString()
  @IsNotEmpty()
  firstname: string;
  @IsString()
  @IsNotEmpty()
  lastname: string;
}
