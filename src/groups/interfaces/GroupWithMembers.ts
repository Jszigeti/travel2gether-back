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
  dateFrom: Date;
  dateTo: Date;
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
