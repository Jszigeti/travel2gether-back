import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { mockToken, mockUser, prismaMock } from './tests/auth.mock';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        EmailService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('createUserWithProfile', () => {
    it('should create a new user with a profile', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await service.createUserWithProfile({
        email: 'testuser@example.com',
        password: 'password123',
        firstname: 'Test',
        lastname: 'User',
      });

      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'testuser@example.com',
          password: 'password123',
          profile: {
            create: {
              firstname: 'Test',
              lastname: 'User',
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('validateUser', () => {
    it('should return a user if credentials are valid', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as unknown as never);

      const result = await service.validateUser(
        'testuser@example.com',
        'password123',
      );
      expect(prismaMock.user.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'testuser@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if credentials are invalid', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(false as unknown as never);

      await expect(
        service.validateUser('testuser@example.com', 'wrongpassword'),
      ).rejects.toThrowError('Invalid credentials');
    });

    it('should throw an error if user is not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrowError('Invalid credentials');
      expect(prismaMock.user.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateTokensSaveRefreshAndSendCookies', () => {
    it('should generate tokens, save the refresh token, and send cookies', async () => {
      const resMock = {
        cookie: jest.fn(),
      };

      prismaMock.token.create.mockResolvedValue(mockToken);

      await service.generateTokensSaveRefreshAndSendCookies(
        mockUser.id,
        resMock as any,
      );

      expect(prismaMock.token.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.token.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: mockUser.id } },
          token: expect.any(String),
          type: 'REFRESH',
          expiredAt: expect.any(Date),
        },
      });

      expect(resMock.cookie).toHaveBeenCalledWith(
        'accessToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        }),
      );
      expect(resMock.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        }),
      );
    });
  });

  describe('hashAndSaveToken', () => {
    it('should hash and save a token', async () => {
      const token = 'rawToken';
      const hashedToken = 'hashedToken';
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedToken as unknown as never);
      prismaMock.token.create.mockResolvedValue(mockToken);

      await service.hashAndSaveToken(token, mockUser.id, 'REFRESH');

      expect(bcrypt.hash).toHaveBeenCalledWith(token, 10);
      expect(prismaMock.token.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: mockUser.id } },
          token: expect.any(String),
          type: 'REFRESH',
          expiredAt: expect.any(Date),
        },
      });
    });
  });
});
