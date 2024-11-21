import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, UserStatus } from '@prisma/client';
import { UserWithName } from './interfaces/UserWithName';
import { ProfileDetails } from './interfaces/ProfileDetails';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithName> {
    const user = await this.prismaService.user.findUnique({
      where: userWhereUniqueInput,
      include: { profile: { select: { firstname: true, lastname: true } } },
    });
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      status: user.status,
      firstname: user.profile.firstname,
      lastname: user.profile.lastname,
    };
  }

  async findProfile(userId: number): Promise<ProfileDetails> {
    const profile = await this.prismaService.profile.findUnique({
      where: { userId },
      include: {
        travelTypes: { select: { travelType: true } },
        lodgings: { select: { lodging: true } },
        interests: { select: { interest: true } },
        languages: { select: { language: true } },
        tripDurations: { select: { tripDuration: true } },
        ratingsReceived: { select: { value: true } },
        groups: {
          select: {
            group: {
              select: {
                id: true,
                title: true,
                pathPicture: true,
                location: true,
                dateFrom: true,
                dateTo: true,
              },
            },
          },
        },
      },
    });

    return {
      profile: {
        ...profile,
        averageRating:
          profile.ratingsReceived
            .map((ratingReceiver) => ratingReceiver.value)
            .reduce((acc, curr) => acc + curr, 0) /
          profile.ratingsReceived.length,
        ratings: profile.ratingsReceived.length,
        travelTypes: profile.travelTypes.map(({ travelType }) => travelType),
        lodgings: profile.lodgings.map(({ lodging }) => lodging),
        interests: profile.interests.map(({ interest }) => interest),
        spokenLanguages: profile.languages.map(({ language }) => language),
        tripDurations: profile.tripDurations.map(
          ({ tripDuration }) => tripDuration,
        ),
        groups: profile.groups.map(({ group }) => ({ ...group })),
      },
    };
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
}
