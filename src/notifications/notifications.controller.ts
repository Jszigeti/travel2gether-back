import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Request } from 'express';
import { Notification } from '@prisma/client';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: Request): Promise<Notification[]> {
    return this.notificationsService.findAll(req.user.sub);
  }

  @Patch(':notificationId')
  async markAsRead(
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ): Promise<string> {
    await this.notificationsService.markAsRead(notificationId);
    return 'Notification successfully marked as read';
  }

  @Delete(':notificationId')
  async delete(
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ): Promise<string> {
    await this.notificationsService.delete(notificationId);
    return 'Notification successfully deleted';
  }
}
