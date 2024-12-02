import { IsOptional, IsArray, IsEnum, IsPositive } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  TravelTypes,
  Lodgings,
  Budget,
  Languages,
  TripDurations,
  Interests,
  ProfileGender,
} from '@prisma/client';

export class SearchUserDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(TravelTypes, { each: true })
  travelTypes?: TravelTypes[];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(Interests, { each: true })
  interests?: Interests[];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(TripDurations, { each: true })
  tripDurations?: TripDurations[];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(Lodgings, { each: true })
  lodgings?: Lodgings[];

  @IsOptional()
  @IsEnum(Budget)
  budget?: Budget;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(Languages, { each: true })
  languages?: Languages[];

  @IsOptional()
  @IsEnum(ProfileGender)
  gender?: ProfileGender;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;
}
