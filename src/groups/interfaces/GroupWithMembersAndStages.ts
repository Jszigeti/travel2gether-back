import { Budget, GroupGender, GroupStatus } from '@prisma/client';

export interface GroupWithMembersAndStages {
  id: number;
  title: string;
  description: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  pathPicture: string;
  status: GroupStatus;
  gender: GroupGender;
  budget: Budget;
  profiles: {
    pathPicture: string;
    userId: number;
    firstname: string;
  }[];
  stages: {
    id: number;
    title: string;
    dateFrom: string;
    dateTo: string;
  }[];
}
