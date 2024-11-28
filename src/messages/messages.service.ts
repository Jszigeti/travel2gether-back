import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message } from '@prisma/client';

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

  // sendToGroup(createMessageDto: CreateMessageDto) {
  //   return 'This action adds a new message';
  // }

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
}
