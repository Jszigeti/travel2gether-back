import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateStageDto {
  @IsOptional()
  file?: Express.Multer.File;

  @IsOptional()
  @IsString()
  pathPicture?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsNumber()
  longitude: number;
}
