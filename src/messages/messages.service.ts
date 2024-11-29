import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { Conversation } from 'src/users/interfaces/Conversation';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
  ) {}

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
}
