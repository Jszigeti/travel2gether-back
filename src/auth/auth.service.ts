import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Token, TokenType, User, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { expiredAtDateGenerator } from 'utils/expiredAtDateGenerator';
import { SignupDto } from './dtos/signup.dto';
import { EmailService } from 'src/email/email.service';
import { TokenWithUserEmail } from './interfaces/TokenWithUserEmail';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Auth functions
  async createUserWithProfile(body: SignupDto): Promise<User> {
    return this.prismaService.user.create({
      data: {
        email: body.email,
        password: body.password,
        profile: {
          create: {
            firstname: body.firstname,
            lastname: body.lastname,
          },
        },
      },
    });
  }

  async checkUserStatus(
    userStatus: UserStatus,
    userId: number,
  ): Promise<string> {
    if (userStatus === UserStatus.BANNED) return 'BANNED';
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
      return 'NOT_VERIFIED';
    }
  }

  // Token functions
  async saveToken(
    userId: number,
    token: string,
    type: TokenType,
  ): Promise<Token> {
    return this.prismaService.token.create({
      data: {
        user: { connect: { id: userId } },
        token,
        type,
        expiredAt: expiredAtDateGenerator(),
      },
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

  async findToken(
    userId: number,
    type: TokenType,
  ): Promise<TokenWithUserEmail> {
    const token = await this.prismaService.token.findUnique({
      where: { userId_type: { userId, type } },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    if (!token) return null;
    return {
      token: token.token,
      type: token.type,
      expiredAt: token.expiredAt,
      userId: token.userId,
      email: token.user.email,
    };
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

  async isTokenExpired(
    savedToken: TokenWithUserEmail,
    type: TokenType,
  ): Promise<boolean> {
    if (new Date() > savedToken.expiredAt) {
      const token = uuidv4();
      await this.hashAndSaveToken(token, savedToken.userId, type);
      // Send mail with token and userId
      await this.emailService.sendMail(
        savedToken.email,
        token,
        savedToken.userId,
        type === TokenType.RESET_PASSWORD && false,
      );
      return true;
    }
    return false;
  }

  async sendCookie(
    res: Response,
    tokenType: string,
    token: string,
  ): Promise<Response<any, Record<string, any>>> {
    return res.cookie(tokenType, token, {
      httpOnly: true,
      // Put secure to true in prod environment
      secure: false,
      // Put same site to strict if front and back share same domain
      sameSite: 'lax',
    });
  }
}
