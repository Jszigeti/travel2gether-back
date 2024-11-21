import { UserStatus } from '@prisma/client';

export interface UserWithName {
  id: number;
  email: string;
  password: string;
  status: UserStatus;
  firstname: string;
  lastname: string;
}
