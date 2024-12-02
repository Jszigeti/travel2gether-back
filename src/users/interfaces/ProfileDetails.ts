import { Budget, ProfileGender } from '@prisma/client';

export interface ProfileDetails {
  profile: {
    userId: number;
    firstname: string;
    lastname: string;
    birthdate: string | null;
    gender: ProfileGender | null;
    pathPicture: string | null;
    description: string | null;
    budget: Budget | null;
    availableFrom: string | null;
    availableTo: string | null;
    averageRating: number | null;
    ratings: number | null;
    travelTypes: string[];
    lodgings: string[];
    interests: string[];
    spokenLanguages: string[];
    tripDurations: string[];
    groups: {
      pathPicture: string;
      id: number;
      title: string;
      location: string;
      dateFrom: string;
      dateTo: string;
    }[];
  };
}
