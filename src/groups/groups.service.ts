import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Budget,
  Group,
  GroupGender,
  GroupRole,
  GroupUser,
  GroupUserStatus,
  Prisma,
} from '@prisma/client';
import { GroupWithMembers } from './interfaces/GroupWithMembers';
import { GroupWithMembersAndStages } from './interfaces/GroupWithMembersAndStages';
import { SearchGroupDto } from './dto/search-group.dto';
import { time } from 'console';
import { GroupCard } from './interfaces/GroupCard';
import { addFilter } from 'utils/addFilter';

@Injectable()
export class GroupsService {
  constructor(private readonly prismaService: PrismaService) {}

  // Group functions
  async create(body: CreateGroupDto, userId: number): Promise<Group> {
    return this.prismaService.group.create({
      data: {
        ...body,
        members: { create: { userId, role: 'AUTHOR', status: 'ACCEPTED' } },
      },
    });
  }

  async findOne(
    groupWhereUniqueInput: Prisma.GroupWhereUniqueInput,
  ): Promise<GroupWithMembers> {
    return this.prismaService.group.findUnique({
      where: groupWhereUniqueInput,
      include: {
        members: { select: { userId: true, role: true, status: true } },
      },
    });
  }

  async getOne(
    groupWhereUniqueInput: Prisma.GroupWhereUniqueInput,
  ): Promise<GroupWithMembersAndStages> {
    const group = await this.prismaService.group.findUnique({
      where: groupWhereUniqueInput,
      include: {
        members: {
          select: {
            status: true,
            role: true,
            user: {
              select: { userId: true, firstname: true, pathPicture: true },
            },
          },
        },
        stages: {
          select: { id: true, title: true, dateFrom: true, dateTo: true },
        },
      },
    });
    if (group) {
      return {
        group: {
          ...group,
          members: group.members.map((member) => ({
            pathPicture: member.user.pathPicture,
            userId: member.user.userId,
            firstname: member.user.firstname,
          })),
          stages: group.stages,
        },
      };
    }
  }

  async search(query: SearchGroupDto): Promise<{
    groups: GroupCard[];
    total: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    const filters: Object[] = [];

    // Vérification : dateTo > dateFrom
    if (
      query.dateFrom &&
      query.dateTo &&
      new Date(query.dateTo) <= new Date(query.dateFrom)
    ) {
      throw new HttpException(
        'dateTo must be later than dateFrom',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Critère pour location (recherche partielle)
    if (query.location) {
      filters.push({
        location: {
          contains: query.location,
        },
      });
    }

    // Filtre pour dateFrom > aujourd'hui
    // filters.push({ dateFrom: { gte: new Date() } });

    // Critère pour dateFrom (date minimale fournie par l'utilisateur)
    if (query.dateFrom) {
      filters.push({ dateFrom: { gte: new Date(query.dateFrom) } });
    }

    // Critère pour dateTo (date maximale fournie par l'utilisateur)
    if (query.dateTo) {
      filters.push({ dateTo: { lte: new Date(query.dateTo) } });
    }

    // Critères pour relations
    addFilter(filters, 'travelTypes', query.travelTypes, 'travelType');
    addFilter(filters, 'lodgings', query.lodgings, 'lodging');
    addFilter(filters, 'languages', query.languages, 'language');
    addFilter(filters, 'ageRanges', query.ageRanges, 'ageRange');

    // Critères simples pour budget et gender
    if (query.budget) {
      filters.push({ budget: query.budget });
    }
    if (query.gender) {
      filters.push({ gender: query.gender });
    }

    // Gestion de la pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Récupérer les résultats avec pagination et tri
    const [groups, total] = await Promise.all([
      this.prismaService.group.findMany({
        where: {
          AND: filters,
        },
        include: {
          members: {
            select: {
              role: true,
              status: true,
              user: { select: { pathPicture: true } },
            },
            where: { status: 'ACCEPTED' },
          },
        },
        skip,
        take: limit,
        orderBy: { dateFrom: 'asc' }, // Trie par dateFrom, de la plus proche à la plus éloignée
      }),
      this.prismaService.group.count({
        where: {
          AND: filters,
        },
      }),
    ]);

    // Calcul des métadonnées de pagination
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = skip + limit < total;

    return {
      groups: groups.map((group) => ({
        id: group.id,
        title: group.title,
        location: group.location,
        dateFrom: group.dateFrom,
        dateTo: group.dateTo,
        pathPicture: group.pathPicture,
        members: group.members.slice(0, 3).map((member) => ({
          role: member.role,
          status: member.status,
          pathPicture: member.user.pathPicture,
        })),
      })),
      total,
      currentPage: page,
      totalPages,
      hasNextPage,
    };
  }

  async update(id: number, body: UpdateGroupDto): Promise<Group> {
    const relations = [
      { key: 'travelTypes', table: 'groupTravelTypes', field: 'travelType' },
      { key: 'lodgings', table: 'groupLodgings', field: 'lodging' },
      { key: 'spokenLanguages', table: 'groupLanguages', field: 'language' },
      { key: 'ageRanges', table: 'groupAgeRange', field: 'ageRange' },
    ];
    const updates = relations.flatMap(({ key, table, field }) => {
      const items = body[key as keyof UpdateGroupDto] as string[] | undefined;
      if (!items) return [];
      return [
        this.prismaService[table].deleteMany({ where: { groupId: id } }),
        this.prismaService[table].createMany({
          body: items.map((item) => ({ id, [field]: item })),
        }),
      ];
    });
    await this.prismaService.$transaction(updates);
    return this.prismaService.group.update({
      where: { id },
      data: {
        budget: body.budget ? (body.budget[0] as Budget) : undefined,
        gender: body.gender ? (body.gender[0] as GroupGender) : undefined,
      },
    });
  }

  async delete(id: number): Promise<Group> {
    return this.prismaService.group.delete({ where: { id } });
  }

  // Group user functions
  async inviteMember(groupId: number, userId: number): Promise<GroupUser> {
    return this.prismaService.groupUser.create({
      data: {
        userId,
        groupId,
        status: 'PENDING',
        role: 'TRAVELER',
        isInvited: true,
      },
    });
  }

  async getMembers(groupId: number): Promise<GroupUser[]> {
    return await this.prismaService.groupUser.findMany({
      where: {
        AND: [{ groupId }, { isInvited: false }],
        NOT: { status: 'DENIED' },
      },
    });
  }

  async manageMemberStatus(
    groupId: number,
    userId: number,
    status: GroupUserStatus,
  ): Promise<GroupUser> {
    return this.prismaService.groupUser.update({
      where: { userId_groupId: { userId, groupId } },
      data: { status },
    });
  }

  async manageMemberRole(
    groupId: number,
    userId: number,
    role: GroupRole,
  ): Promise<GroupUser> {
    return this.prismaService.groupUser.update({
      where: { userId_groupId: { userId, groupId } },
      data: { role },
    });
  }

  // User interactions with group functions
  async sendRequest(groupId: number, userId: number): Promise<GroupUser> {
    return this.prismaService.groupUser.create({
      data: {
        userId,
        groupId,
        status: 'PENDING',
        role: 'TRAVELER',
      },
    });
  }

  async denyInvitation(groupId: number, userId: number): Promise<GroupUser> {
    return this.prismaService.groupUser.delete({
      where: { userId_groupId: { userId, groupId } },
    });
  }

  // Utils functions
  async checkIfUserIsAuthorized(
    group: GroupWithMembers,
    userId: number,
    checkAuthor: boolean = false,
  ): Promise<boolean> {
    return group.members.some((member) => {
      if (!(member.userId === userId)) return false;
      if (checkAuthor) return member.role === 'AUTHOR';
      return member.role !== 'TRAVELER' && member.status !== 'DENIED';
    });
  }
}
