import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
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
    if (!(await this.usersService.findProfile(userReceiverId)))
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
  findAll() {
    return this.messagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }
}
