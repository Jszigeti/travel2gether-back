import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import { GroupsService } from 'src/groups/groups.service';
import { IsMember } from 'src/groups/decorators/isMember.decorator';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Post('/user/:userReceiverId')
  async sendToUser(
    @Body() createMessageDto: CreateMessageDto,
    @Param('userReceiverId', ParseIntPipe) userReceiverId: number,
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

  @Post('/group/:groupReceiverId')
  @IsMember(Number(':groupReceiverId'))
  async sendToGroup(
    @Body() createMessageDto: CreateMessageDto,
    @Param('groupReceiverId', ParseIntPipe) groupReceiverId: number,
    @Req() req: Request,
  ) {
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

  @Get('/group/:groupId')
  @IsMember(Number(':groupId'))
  async findGroupChat(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ) {
    return this.messagesService.findGroupChat(groupId, req.user.sub);
  }

  @Get('/user/:interlocutorId')
  async findUserChat(
    @Param('interlocutorId', ParseIntPipe) interlocutorId: number,
    @Req() req: Request,
  ) {
    if (!(await this.usersService.findProfile({ userId: interlocutorId })))
      throw new NotFoundException('User not found');
    return this.messagesService.findUserChat(interlocutorId, req.user.sub);
  }
}
