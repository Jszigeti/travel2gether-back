import {
  Budget,
  GroupGender,
  GroupRole,
  GroupStatus,
  GroupUserStatus,
} from '@prisma/client';
import { GroupWithMembers } from './GroupWithMembers';

export interface GroupWithMembersAndStages {
  group: {
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
  };
}
