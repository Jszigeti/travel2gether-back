import { GroupRole } from '@prisma/client';

export interface GroupCard {
  id: number;
  title: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  pathPicture: string;
  profiles: {
    role: GroupRole;
    pathPicture: string;
  }[];
}
