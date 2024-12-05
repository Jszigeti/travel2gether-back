import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import { GroupsService } from 'src/groups/groups.service';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Post('/user/:user_receiver_id')
  async sendToUser(
    @Body() createMessageDto: CreateMessageDto,
    @Param('user_receiver_id', ParseIntPipe) userReceiverId: number,
    @Req() req: Request,
  ) {
    if (!(await this.usersService.findProfile({ userId: userReceiverId })))
      throw new NotFoundException('User not found');
    return this.messagesService.sendToUser(
      createMessageDto,
      userReceiverId,
      req.user.sub,
    );
  }

  @Post('/group/:group_receiver_id')
  async sendToGroup(
    @Body() createMessageDto: CreateMessageDto,
    @Param('group_receiver_id', ParseIntPipe) groupReceiverId: number,
    @Req() req: Request,
  ) {
    if (!(await this.groupsService.findOne({ id: groupReceiverId })))
      throw new NotFoundException('Group not found');
    return this.messagesService.sendToGroup(
      createMessageDto,
      groupReceiverId,
      req.user.sub,
    );
  }

  @Get()
  findConversations(@Req() req: Request) {
    const userId = req.user.sub;
    return this.messagesService.findConversations(userId);
  }

  @Get('/group/:group_id')
  async findGroupChat(
    @Param('group_id', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ) {
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    if (!group.members.some((member) => member.userId === req.user.sub))
      throw new ForbiddenException('User not found in group');
    return this.messagesService.findGroupChat(groupId, req.user.sub);
  }

  @Get('/user/:interlocutor_id')
  async findUserChat(
    @Param('interlocutor_id', ParseIntPipe) interlocutorId: number,
    @Req() req: Request,
  ) {
    if (!(await this.usersService.findProfile({ userId: interlocutorId })))
      throw new NotFoundException('User not found');
    return this.messagesService.findUserChat(interlocutorId, req.user.sub);
  }
}
