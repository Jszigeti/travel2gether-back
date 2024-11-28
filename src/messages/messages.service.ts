import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Conversation } from './interfaces/Conversation';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createMessageDto: CreateMessageDto) {
    return 'This action adds a new message';
  }

  findAll() {
    return `This action returns all messages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }

  async retrieveConversations(userId: number): Promise<Conversation[]> {
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
