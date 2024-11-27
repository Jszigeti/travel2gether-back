import {
  Budget,
  Interests,
  Languages,
  Lodgings,
  ProfileGender,
  TravelTypes,
  TripDurations,
} from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsDate,
  IsString,
  MaxLength,
  IsUrl,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ProfileGender, { each: true })
  gender?: ProfileGender[];

  @IsOptional()
  @IsString()
  @IsUrl()
  pathPicture?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Interests, { each: true })
  interests?: Interests[];

  @IsOptional()
  @IsArray()
  @IsEnum(Languages, { each: true })
  spokenLanguages?: Languages[];

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
  @IsDate()
  availableFrom?: string;

  @IsOptional()
  @IsDate()
  availableTo?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TripDurations, { each: true })
  tripDurations?: TripDurations[];
}
