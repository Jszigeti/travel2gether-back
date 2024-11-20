import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Profile, User, UserStatus } from '@prisma/client';
import { CreateProfileDto } from './dto/create-profil.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProfile(createProfileDto: CreateProfileDto): Promise<Profile> {
    return this.prismaService.profile.create({ data: createProfileDto });
  }

  async editUserStatus(id: number, status: UserStatus): Promise<string> {
    await this.prismaService.user.update({
      where: { id },
      data: { status },
    });
    return 'User status edited successfully';
  }

  async resetUserPassword(id: number, password: string): Promise<string> {
    await this.prismaService.user.update({
      where: { id },
      data: { password },
    });
    return 'User password reset successfully';
  }

  // findAll() {
  //   return `This action returns all users`;
  // }

  async findUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User> {
    return this.prismaService.user.findUnique({ where: userWhereUniqueInput });
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
