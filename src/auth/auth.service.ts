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
import { JwtService } from '@nestjs/jwt';
import { UserWithNameAndAvatar } from 'src/users/interfaces/UserWithNameAndAvatar';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
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

  async isStatusVerified(user: UserWithNameAndAvatar): Promise<boolean> {
    // If user is verified return true
    if (user.status === UserStatus.VERIFIED) return true;
    if (user.status === UserStatus.NOT_VERIFIED) {
      // Generate verification token and save it in DB
      const verificationToken = uuidv4();
      await this.updateToken(
        user.id,
        await bcrypt.hash(verificationToken, 10), // Hash verification token
        TokenType.VERIFICATION,
      );
      // Send mail with verification token and userId
      await this.emailService.sendMail(user.email, verificationToken, user.id);
      // Return false
      return false;
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

  async findTokenAndCheckIfExpired(
    userId: number,
    type: TokenType,
  ): Promise<TokenWithUserEmail> {
    const token = await this.prismaService.token.findUnique({
      where: { userId_type: { userId, type }, expiredAt: { gt: new Date() } },
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

  async generateHashSaveAndSendToken(
    userId: number,
    type: TokenType,
    email: string,
  ) {
    const token = uuidv4();
    await this.hashAndSaveToken(token, userId, type);
    await this.emailService.sendMail(
      email,
      token,
      userId,
      type === TokenType.VERIFICATION,
    );
  }

  async generateTokensSaveRefreshAndSendCookies(
    userId: number,
    res: Response,
  ): Promise<void> {
    // Generate tokens
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: '5m', secret: process.env.SECRET_KEY },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: '1d', secret: process.env.SECRET_REFRESH_KEY },
    );
    // Hash and save it in DB
    await this.hashAndSaveToken(refreshToken, userId, TokenType.REFRESH);
    // Send cookies
    await this.sendCookie(res, 'accessToken', accessToken);
    await this.sendCookie(res, 'refreshToken', refreshToken);
  }

  async sendCookie(
    res: Response,
    tokenType: string,
    token: string,
  ): Promise<void> {
    res.cookie(tokenType, token, {
      httpOnly: true,
      // Put secure to true in prod environment
      secure: false,
      // Put same site to strict if front and back share same domain
      sameSite: 'lax',
      maxAge: tokenType === 'accessToken' ? 1000 * 60 * 5 : 1000 * 60 * 60 * 24,
    });
  }
}
