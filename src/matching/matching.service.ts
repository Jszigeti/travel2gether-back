import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupCard } from 'src/groups/interfaces/GroupCard';
import { matchCount } from 'utils/matchCount';
import { calculateAge, getAgeRange } from 'utils/ageMatching';
import { UserAvatar } from 'src/users/interfaces/userAvatar';
import { addFilter } from 'utils/addFilter';

@Injectable()
export class MatchingService {
  constructor(private readonly prismaService: PrismaService) {}

  async matchGroups(userId: number): Promise<GroupCard[]> {
    const userProfile = await this.prismaService.profile.findUnique({
      where: { userId },
      include: {
        travelTypes: { select: { travelType: true } },
        lodgings: { select: { lodging: true } },
        languages: { select: { language: true } },
      },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Système de matching
    const filters: Object[] = [];
    const userAge = calculateAge(userProfile.birthdate);
    const userAgeRange = getAgeRange(userAge);
    filters.push({ ageRanges: { some: { ageRange: userAgeRange } } });

    if (userProfile.gender && userProfile.gender !== 'OTHER') {
      filters.push({ gender: userProfile.gender });
    }

    if (userProfile.availableFrom && userProfile.availableTo) {
      filters.push({
        AND: [
          { dateFrom: { gte: userProfile.availableFrom } },
          { dateTo: { lte: userProfile.availableTo } },
        ],
      });
    }

    // Recherche des groupes
    const groups = await this.prismaService.group.findMany({
      where: { AND: filters },
      take: 10,
      include: {
        ageRanges: { select: { ageRange: true } },
        travelTypes: { select: { travelType: true } },
        lodgings: { select: { lodging: true } },
        languages: { select: { language: true } },
        members: {
          where: { status: 'ACCEPTED' },
          select: {
            user: { select: { pathPicture: true } },
            role: true,
          },
          take: 3,
        },
      },
    });
    if (groups.length < 10) {
      const lastGroups = await this.prismaService.group.findMany({
        take: 10 - groups.length,
        orderBy: { createdAt: 'desc' },
        include: {
          ageRanges: { select: { ageRange: true } },
          travelTypes: { select: { travelType: true } },
          lodgings: { select: { lodging: true } },
          languages: { select: { language: true } },
          members: {
            where: { status: 'ACCEPTED' },
            select: {
              user: { select: { pathPicture: true } },
              role: true,
            },
            take: 3,
          },
        },
      });
      groups.push(...lastGroups);
    }

    // Calcul des scores
    const scoredGroups = groups.map((group) => {
      let score = 0;

      if (group.ageRanges.some((r) => r.ageRange === userAgeRange)) score++;
      if (group.gender === userProfile.gender || group.gender === 'MIXED')
        score++;
      if (group.budget === userProfile.budget) score++;
      if (
        userProfile.availableFrom &&
        userProfile.availableTo &&
        group.dateFrom >= userProfile.availableFrom &&
        group.dateTo <= userProfile.availableTo
      ) {
        score++;
      }

      score += matchCount(
        userProfile.travelTypes.map((t) => t.travelType),
        group.travelTypes.map((t) => t.travelType),
      );
      score += matchCount(
        userProfile.lodgings.map((l) => l.lodging),
        group.lodgings.map((l) => l.lodging),
      );
      score += matchCount(
        userProfile.languages.map((l) => l.language),
        group.languages.map((l) => l.language),
      );

      return { ...group, score };
    });

    scoredGroups.sort((a, b) => b.score - a.score);

    return scoredGroups.map((group) => ({
      id: group.id,
      title: group.title,
      location: group.location,
      dateFrom: group.dateFrom,
      dateTo: group.dateTo,
      pathPicture: group.pathPicture,
      members: group.members.map((member) => ({
        pathPicture: member.user.pathPicture,
        role: member.role,
      })),
    }));
  }

  async matchUsers(userId: number): Promise<UserAvatar[]> {
    const userProfile = await this.prismaService.profile.findUnique({
      where: { userId },
      include: {
        travelTypes: { select: { travelType: true } },
        lodgings: { select: { lodging: true } },
        languages: { select: { language: true } },
        interests: { select: { interest: true } },
        tripDurations: { select: { tripDuration: true } },
      },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Système de matching
    const filters: Object[] = [];

    if (userProfile.availableFrom && userProfile.availableTo) {
      filters.push({
        AND: [
          { availableFrom: { gte: userProfile.availableFrom } },
          { availableTo: { lte: userProfile.availableTo } },
        ],
      });
    }

    addFilter(
      filters,
      'tripDurations',
      userProfile.tripDurations.map((t) => t.tripDuration),
      'tripDuration',
    );

    // Recherche d'utilisateurs
    const users = await this.prismaService.profile.findMany({
      where: { AND: filters },
      take: 10,
      include: {
        travelTypes: { select: { travelType: true } },
        lodgings: { select: { lodging: true } },
        languages: { select: { language: true } },
        tripDurations: { select: { tripDuration: true } },
        interests: { select: { interest: true } },
      },
    });
    if (users.length < 10) {
      const lastUsers = await this.prismaService.profile.findMany({
        take: 10 - users.length,
        orderBy: { createdAt: 'desc' },
        include: {
          travelTypes: { select: { travelType: true } },
          lodgings: { select: { lodging: true } },
          languages: { select: { language: true } },
          tripDurations: { select: { tripDuration: true } },
          interests: { select: { interest: true } },
        },
      });
      users.push(...lastUsers);
    }

    // Calcul des scores
    const scoredUsers = users.map((user) => {
      let score = 0;

      if (user.budget === userProfile.budget) score++;
      if (
        userProfile.availableFrom &&
        userProfile.availableTo &&
        user.availableFrom >= userProfile.availableFrom &&
        user.availableTo <= userProfile.availableTo
      ) {
        score++;
      }

      score += matchCount(
        userProfile.travelTypes.map((t) => t.travelType),
        user.travelTypes.map((t) => t.travelType),
      );
      score += matchCount(
        userProfile.lodgings.map((l) => l.lodging),
        user.lodgings.map((l) => l.lodging),
      );
      score += matchCount(
        userProfile.languages.map((l) => l.language),
        user.languages.map((l) => l.language),
      );
      score += matchCount(
        userProfile.interests.map((i) => i.interest),
        user.interests.map((i) => i.interest),
      );
      score += matchCount(
        userProfile.tripDurations.map((t) => t.tripDuration),
        user.tripDurations.map((t) => t.tripDuration),
      );

      return { ...user, score };
    });

    scoredUsers.sort((a, b) => b.score - a.score);

    return scoredUsers.map((user) => ({
      userId: user.userId,
      firstname: user.firstname,
      lastname: user.lastname,
      pathPicture: user.pathPicture,
    }));
  }
}
