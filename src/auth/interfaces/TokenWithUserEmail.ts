import { TokenType } from '@prisma/client';

export interface TokenWithUserEmail {
  token: string;
  type: TokenType;
  expiredAt: Date;
  userId: number;
  email: string;
}
