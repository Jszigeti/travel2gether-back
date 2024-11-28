import { Injectable } from '@nestjs/common';
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
