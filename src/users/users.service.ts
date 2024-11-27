import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Budget,
  Prisma,
  Profile,
  ProfileGender,
  UserStatus,
} from '@prisma/client';
import { UserWithName } from './interfaces/UserWithName';
import { ProfileDetails } from './interfaces/ProfileDetails';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      status: user.status,
      firstname: user.profile.firstname,
      lastname: user.profile.lastname,
    };
  }

  async findProfile(
    profileWhereUniqueInput: Prisma.ProfileWhereUniqueInput,
  ): Promise<Profile> {
    return this.prismaService.profile.findUnique({
      where: profileWhereUniqueInput,
    });
  }

  async getProfile(
    profileWhereUniqueInput: Prisma.ProfileWhereUniqueInput,
  ): Promise<ProfileDetails> {
    const profile = await this.prismaService.profile.findUnique({
      where: profileWhereUniqueInput,
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
    const { ratingsReceived, languages, ...profileWithoutRatingsUntraited } =
      profile;
    return {
      profile: {
        ...profileWithoutRatingsUntraited,
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

  async patchUser(id: number, body: UpdateUserDto): Promise<string> {
    const { email, firstname, lastname, password } = body;
    await this.prismaService.user.update({
      where: { id },
      data: { email, password, profile: { update: { firstname, lastname } } },
    });
    return 'User successfully updated';
  }

  async patchProfile(userId: number, body: UpdateProfileDto): Promise<string> {
    const relations = [
      { key: 'interests', table: 'profileInterests', field: 'interest' },
      { key: 'spokenLanguages', table: 'profileLanguages', field: 'language' },
      { key: 'travelTypes', table: 'profileTravelTypes', field: 'travelType' },
      { key: 'lodgings', table: 'profileLodgings', field: 'lodging' },
      {
        key: 'tripDurations',
        table: 'profileTripDurations',
        field: 'tripDuration',
      },
    ];
    const updates = relations.flatMap(({ key, table, field }) => {
      const items = body[key as keyof UpdateProfileDto] as string[] | undefined;
      if (!items) return [];
      return [
        this.prismaService[table].deleteMany({ where: { userId } }),
        this.prismaService[table].createMany({
          body: items.map((item) => ({ userId, [field]: item })),
        }),
      ];
    });
    await this.prismaService.$transaction(updates);
    await this.prismaService.profile.update({
      where: { userId },
      data: {
        budget: body.budget ? (body.budget[0] as Budget) : undefined,
        gender: body.gender ? (body.gender[0] as ProfileGender) : undefined,
      },
    });
    return 'Profile successfully updated';
  }

  async deleteUser(id: number): Promise<string> {
    await this.prismaService.user.delete({
      where: { id },
    });
    return 'User successfully deleted';
  }
}
