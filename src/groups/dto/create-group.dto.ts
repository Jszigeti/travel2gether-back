import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  pathPicture: string;

  @IsNotEmpty()
  @IsString()
  dateFrom: string;

  @IsNotEmpty()
  @IsString()
  dateTo: string;
}
