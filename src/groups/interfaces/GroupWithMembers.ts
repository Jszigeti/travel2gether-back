import {
  Budget,
  GroupGender,
  GroupRole,
  GroupStatus,
  GroupUserStatus,
} from '@prisma/client';

export interface GroupWithMembers {
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
  members: {
    status: GroupUserStatus;
    role: GroupRole;
    userId: number;
  }[];
}
