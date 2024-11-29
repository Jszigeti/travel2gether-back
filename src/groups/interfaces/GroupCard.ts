import { GroupRole, GroupUserStatus } from '@prisma/client';

export interface GroupCard {
  id: number;
  title: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  pathPicture: string;
  members: {
    role: GroupRole;
    status: GroupUserStatus;
    pathPicture: string;
  }[];
}
