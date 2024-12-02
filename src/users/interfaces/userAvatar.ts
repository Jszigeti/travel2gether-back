import { UserStatus } from '@prisma/client';

export interface UserAvatar {
  userId: number;
  firstname: string;
  lastname: string;
  pathPicture: string | null;
}
