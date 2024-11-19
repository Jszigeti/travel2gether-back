import { Injectable } from '@nestjs/common';
import { Token, TokenType, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createAuthDto: {
    email: string;
    password: string;
  }): Promise<User> {
    return this.prismaService.user.create({ data: createAuthDto });
  }

  // findAll() {
  //   return `This action returns all auth`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} auth`;
  // }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} auth`;
  // }

  // TOKEN FUNCTIONS
  async saveToken(
    userId: number,
    token: string,
    type: TokenType,
  ): Promise<Token> {
    return this.prismaService.token.create({ data: { userId, token, type } });
  }

  async updateToken(id: number, token: string): Promise<Token> {
    return this.prismaService.token.update({
      where: {
        id,
      },
      data: {
        token,
      },
    });
  }

  async findToken(userId: number, type: TokenType): Promise<Token> {
    const token = await this.prismaService.token.findFirst({
      where: {
        AND: {
          userId,
          type,
        },
      },
    });
    return token;
  }

  async deleteToken(id: number): Promise<string> {
    await this.prismaService.token.delete({ where: { id } });
    return 'Token deleted';
  }
}
