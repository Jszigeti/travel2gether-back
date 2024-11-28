import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Notification, NotificationReferenceType } from '@prisma/client';
import { GroupWithMembers } from 'src/groups/interfaces/GroupWithMembers';

@Injectable()
export class NotificationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    userId: number,
    referenceId: number,
    referenceType: NotificationReferenceType,
    details: string,
  ): Promise<Notification> {
    return this.prismaService.notification.create({
      data: {
        userId,
        referenceId,
        referenceType,
        details,
      },
    });
  }

  async findAll(userId: number): Promise<Notification[]> {
    return this.prismaService.notification.findMany({ where: { userId } });
  }

  async markAsRead(id: number): Promise<Notification> {
    return this.prismaService.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async delete(id: number): Promise<Notification> {
    return this.prismaService.notification.delete({ where: { id } });
  }

  // Utils functions
  async createToAllMembers(
    group: GroupWithMembers,
    iniatorId: number,
    type: NotificationReferenceType,
    details: string,
  ) {
    if (group.members.length > 1) {
      await Promise.all(
        group.members
          .filter((member) => member.userId !== iniatorId)
          .map((member) => this.create(member.userId, group.id, type, details)),
      );
    }
  }

  async createToAuthorAndOrganizers(
    group: GroupWithMembers,
    type: NotificationReferenceType,
    details: string,
  ) {
    await Promise.all(
      group.members
        .filter(
          (member) => member.role === 'AUTHOR' || member.role === 'ORGANIZER',
        )
        .map((member) => this.create(member.userId, group.id, type, details)),
    );
  }
}
