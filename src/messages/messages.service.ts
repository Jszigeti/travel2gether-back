import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message } from '@prisma/client';
import { Conversation } from 'src/users/interfaces/Conversation';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async sendToUser(
    body: CreateMessageDto,
    userReceiverId: number,
    senderId: number,
  ): Promise<Message> {
    return this.prismaService.message.create({
      data: {
        content: body.content,
        userReceiverId,
        senderId,
      },
    });
  }

  async sendToGroup(
    body: CreateMessageDto,
    groupReceiverId: number,
    senderId: number,
  ): Promise<Message> {
    return this.prismaService.message.create({
      data: {
        content: body.content,
        groupReceiverId,
        senderId,
      },
    });
  }

  async findConversations(userId: number): Promise<Conversation[]> {
    const messages = await this.prismaService.message.findMany({
      where: {
        OR: [{ senderId: userId }, { userReceiverId: userId }],
        NOT: { groupReceiverId: { not: null } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        senderUser: {
          select: {
            userId: true,
            firstname: true,
            lastname: true,
            pathPicture: true,
          },
        },
        receiverUser: {
          select: {
            userId: true,
            firstname: true,
            lastname: true,
            pathPicture: true,
          },
        },
      },
    });

    const conversations: Conversation[] = [];

    messages.forEach((message) => {
      const interlocutor =
        message.senderId === userId ? message.receiverUser : message.senderUser;

      if (
        !conversations.some(
          (conversation) =>
            conversation.interlocutor.userId === interlocutor.userId,
        )
      ) {
        conversations.push({
          id: message.id,
          lastMessageContent: message.content,
          createdAt: message.createdAt,
          interlocutor,
        });
      }
    });
    return conversations;
  }

  async findGroupChat(groupReceiverId: number, userId: number) {
    const groupChat = await this.prismaService.message.findMany({
      where: { groupReceiverId },
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
        senderUser: {
          select: {
            userId: true,
            pathPicture: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return groupChat.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      profile: {
        id: message.senderId,
        pathPicture: message.senderUser.pathPicture,
        firstname: message.senderUser.firstname,
        lastname: message.senderUser.lastname,
        isSender: message.senderId === userId,
      },
    }));
  }

  async findUserChat(interlocutorId: number, userId: number) {
    const userChat = await this.prismaService.message.findMany({
      where: {
        OR: [
          { senderId: userId, userReceiverId: interlocutorId },
          { senderId: interlocutorId, userReceiverId: userId },
        ],
      },
      select: {
        id: true,
        senderId: true,
        userReceiverId: true,
        createdAt: true,
        content: true,
      },
    });
    if (!userChat) throw new NotFoundException();
    const interlocutor = await this.prismaService.profile.findUnique({
      where: {
        userId: interlocutorId,
      },
      select: {
        userId: true,
        pathPicture: true,
        firstname: true,
        lastname: true,
      },
    });

    return {
      messages: userChat.map((message) => ({
        ...message,
        isSender: message.senderId === userId,
      })),
      interlocutor,
    };
  }
}
