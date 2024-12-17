import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  // @IsNotEmpty()
  file: Express.Multer.File;

  @IsOptional()
  @IsString()
  pathPicture: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsString()
  dateFrom: string;

  @IsNotEmpty()
  @IsString()
  dateTo: string;
}
