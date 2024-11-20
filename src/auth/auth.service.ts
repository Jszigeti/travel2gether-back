import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Token, TokenType, User, UserStatus } from '@prisma/client';
import { SigninDto } from './dtos/signin.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { expiredAtDateGenerator } from 'utils/expiredAtDateGenerator';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(createAuthDto: SigninDto): Promise<User> {
    return this.prismaService.user.create({ data: createAuthDto });
  }

  async checkUserStatus(userStatus: UserStatus, userId: number): Promise<void> {
    if (userStatus === UserStatus.BANNED)
      throw new UnauthorizedException('User banned');
    if (userStatus === UserStatus.NOT_VERIFIED) {
      // Generate verification token and save it in DB
      const verificationToken = uuidv4();
      await this.updateToken(
        userId,
        await bcrypt.hash(verificationToken, 10), // Hash verification token
        TokenType.VERIFICATION,
      );
      // Send mail with verification token and userId
      // ...
      throw new UnauthorizedException(
        'User not verified, please check your mails',
      );
    }
  }

  // Token functions
  async saveToken(
    userId: number,
    token: string,
    type: TokenType,
  ): Promise<Token> {
    return this.prismaService.token.create({
      data: { userId, token, type, expiredAt: expiredAtDateGenerator() },
    });
  }

  async updateToken(
    userId: number,
    token: string,
    type: TokenType,
  ): Promise<Token> {
    return this.prismaService.token.update({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      data: {
        token,
        expiredAt: expiredAtDateGenerator(),
      },
    });
  }

  async findToken(userId: number, type: TokenType): Promise<Token> {
    return this.prismaService.token.findUnique({
      where: { userId_type: { userId, type } },
    });
  }

  async deleteToken(userId: number, type: TokenType): Promise<string> {
    await this.prismaService.token.delete({
      where: { userId_type: { userId, type } },
    });
    return 'Token deleted';
  }

  async hashAndSaveToken(
    token: string,
    userId: number,
    type: TokenType,
  ): Promise<void> {
    if (await this.findToken(userId, type)) {
      await this.updateToken(userId, await bcrypt.hash(token, 10), type);
    } else {
      await this.saveToken(userId, await bcrypt.hash(token, 10), type);
    }
  }

  async checkIfTokenExpired(savedToken: Token, type: TokenType) {
    if (new Date() > savedToken.expiredAt) {
      const token = uuidv4();
      await this.hashAndSaveToken(token, savedToken.userId, type);
      // Send mail with token and userId
      // ...
      throw new UnauthorizedException();
    }
  }
}
