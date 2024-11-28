import { IsDate, IsNotEmpty, IsString, IsUrl } from 'class-validator';

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

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  pathPicture: string;

  @IsNotEmpty()
  @IsDate()
  dateFrom: string;

  @IsNotEmpty()
  @IsDate()
  dateTo: string;
}
