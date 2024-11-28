import { GroupRole, GroupUserStatus } from '@prisma/client';

export interface GroupCard {
  id: number;
  title: string;
  location: string;
  dateFrom: Date;
  dateTo: Date;
  pathPicture: string;
  members: {
    role: GroupRole;
    status: GroupUserStatus;
    pathPicture: string;
  }[];
}
