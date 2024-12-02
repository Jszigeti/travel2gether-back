import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { isFloat32Array } from 'util/types';

export class CreateStageDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  dateFrom: string;

  @IsNotEmpty()
  @IsString()
  dateTo: string;

  @IsOptional()
  @IsString()
  pathPicture: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
