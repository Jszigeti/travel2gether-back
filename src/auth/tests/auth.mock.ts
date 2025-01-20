import { User, Token, TokenType } from '@prisma/client';

export const prismaMock = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  token: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

export const mockUser: User = {
  id: 1,
  email: 'testuser@example.com',
  password: '$2b$10$hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'VERIFIED',
};

export const mockToken: Token = {
  userId: 1,
  token: 'hashedToken',
  type: TokenType.REFRESH,
  expiredAt: new Date(Date.now() + 3600 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};
