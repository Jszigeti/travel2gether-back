import {
  IsOptional,
  IsString,
  IsPositive,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  TravelTypes,
  Lodgings,
  Budget,
  Languages,
  AgeRanges,
  GroupGender,
} from '@prisma/client';

export class SearchGroupDto {
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
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(TravelTypes, { each: true }) // Valide chaque élément comme une énumération
  travelTypes?: TravelTypes[];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(Lodgings, { each: true }) // Valide chaque élément comme une énumération
  lodgings?: Lodgings[];

  @IsOptional()
  @IsEnum(Budget) // Valide comme une énumération
  budget?: Budget;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(Languages, { each: true }) // Valide chaque élément comme une énumération
  languages?: Languages[];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(AgeRanges, { each: true }) // Valide chaque élément comme une énumération
  ageRanges?: AgeRanges[];

  @IsOptional()
  @IsEnum(GroupGender) // Valide comme une énumération
  gender?: GroupGender;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;
}
