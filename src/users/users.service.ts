import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Budget,
  Prisma,
  Profile,
  ProfileGender,
  UserStatus,
} from '@prisma/client';
import { UserWithNameAndAvatar } from './interfaces/UserWithNameAndAvatar';
import { ProfileDetails } from './interfaces/ProfileDetails';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { addFilter } from 'utils/addFilter';
import { UserAvatar } from './interfaces/userAvatar';
import { last } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getLastProfiles(): Promise<UserAvatar[]> {
    const lastUsers = await this.prismaService.profile.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        travelTypes: { select: { travelType: true } },
        lodgings: { select: { lodging: true } },
        languages: { select: { language: true } },
        tripDurations: { select: { tripDuration: true } },
        interests: { select: { interest: true } },
      },
    });
    return lastUsers.map((user) => ({
      userId: user.userId,
      firstname: user.firstname,
      lastname: user.lastname,
      pathPicture: user.pathPicture,
    }));
  }

  // Search users
  async search(query: SearchUserDto): Promise<{
    users: UserAvatar[];
    total: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    const filters = [];

    // Ajout des filtres via la fonction utilitaire
    addFilter(filters, 'travelTypes', query.travelTypes, 'travelType');
    addFilter(filters, 'interests', query.interests, 'interest');
    addFilter(filters, 'tripDurations', query.tripDurations, 'tripDuration');
    addFilter(filters, 'lodgings', query.lodgings, 'lodging');
    addFilter(filters, 'languages', query.languages, 'language');

    // Filtre pour budget et genre
    if (query.budget) {
      filters.push({ budget: query.budget });
    }
    if (query.gender) {
      filters.push({ gender: query.gender });
    }

    // Filtre pour le statut VERIFIED
    filters.push({ user: { status: UserStatus.VERIFIED } });

    // Gestion de la pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Récupérer les résultats avec pagination et champs spécifiques
    const [users, total] = await Promise.all([
      this.prismaService.profile.findMany({
        where: {
          AND: filters,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          firstname: true,
          lastname: true,
          pathPicture: true,
        },
      }),
      this.prismaService.profile.count({
        where: {
          AND: filters,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = skip + limit < total;

    const formattedUsers = users.map((user) => ({
      userId: user.userId,
      firstname: user.firstname,
      lastname: user.lastname,
      pathPicture: user.pathPicture,
    }));

    return {
      users: formattedUsers,
      total,
      currentPage: page,
      totalPages,
      hasNextPage,
    };
  }

  // User functions
  async findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithNameAndAvatar> {
    const user = await this.prismaService.user.findUnique({
      where: userWhereUniqueInput,
      include: {
        profile: {
          select: {
            firstname: true,
            lastname: true,
            pathPicture: true,
          },
        },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      status: user.status,
      firstname: user.profile.firstname,
      lastname: user.profile.lastname,
      pathPicture: user.profile.pathPicture,
    };
  }

  async update(id: number, body: UpdateUserDto): Promise<string> {
    const { email, firstname, lastname, password } = body;
    await this.prismaService.user.update({
      where: { id },
      data: { email, password, profile: { update: { firstname, lastname } } },
    });
    return 'User successfully updated';
  }

  async updateStatus(id: number, status: UserStatus): Promise<string> {
    await this.prismaService.user.update({
      where: { id },
      data: { status },
    });
    return 'User status edited successfully';
  }

  async resetPassword(id: number, password: string): Promise<string> {
    await this.prismaService.user.update({
      where: { id },
      data: { password },
    });
    return 'User password reset successfully';
  }

  async delete(id: number): Promise<string> {
    await this.prismaService.user.delete({
      where: { id },
    });
    return 'User successfully deleted';
  }

  // Profile functions
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
      ...profileWithoutRatingsUntraited,
      gender: [profile.gender],
      budget: [profile.budget],
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
    };
  }

  async updateProfile(
    userId: number,
    body: UpdateProfileDto,
  ): Promise<Profile> {
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
      if (this.prismaService[table].count({ where: { userId } }) > 0) {
        return [
          this.prismaService[table].deleteMany({ where: { userId } }),
          this.prismaService[table].createMany({
            data: items.map((item) => ({ userId, [field]: item })),
          }),
        ];
      } else {
        return [
          this.prismaService[table].deleteMany({ where: { userId } }),
          this.prismaService[table].createMany({
            data: items.map((item) => ({ userId, [field]: item })),
          }),
        ];
      }
    });
    await this.prismaService.$transaction(updates);
    return this.prismaService.profile.update({
      where: { userId },
      data: {
        description: body.description ? body.description : undefined,
        pathPicture: body.pathPicture ? body.pathPicture : undefined,
        birthdate: body.birthdate ? body.birthdate : undefined,
        budget: body.budget ? (body.budget[0] as Budget) : undefined,
        gender: body.gender ? (body.gender[0] as ProfileGender) : undefined,
        availableFrom: body.availableFrom ? body.availableFrom : undefined,
        availableTo: body.availableTo ? body.availableTo : undefined,
      },
    });
    // return 'Profile successfully updated';
  }
}
