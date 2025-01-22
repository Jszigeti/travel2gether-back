import { UserStatus } from '@prisma/client';

export interface UserWithNameAndAvatar {
  id: number;
  email: string;
  password: string;
  status: UserStatus;
  firstname: string;
  lastname: string;
  pathPicture: string;
}
