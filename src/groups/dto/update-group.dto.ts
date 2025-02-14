import {
  AgeRanges,
  Budget,
  GroupGender,
  Languages,
  Lodgings,
  TravelTypes,
} from '@prisma/client';
import { IsArray, IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  file?: Express.Multer.File;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  pathPicture?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(GroupGender, { each: true })
  gender?: GroupGender[];

  @IsOptional()
  @IsArray()
  @IsEnum(Budget, { each: true })
  budget?: Budget[];

  @IsOptional()
  @IsArray()
  @IsEnum(TravelTypes, { each: true })
  travelTypes?: TravelTypes[];

  @IsOptional()
  @IsArray()
  @IsEnum(Lodgings, { each: true })
  lodgings?: Lodgings[];

  @IsOptional()
  @IsArray()
  @IsEnum(Languages, { each: true })
  spokenLanguages?: Languages[];

  @IsOptional()
  @IsArray()
  @IsEnum(AgeRanges, { each: true })
  ageRanges?: AgeRanges[];
}
