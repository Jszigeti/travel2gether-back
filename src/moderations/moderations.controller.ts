import {
  Controller,
  Post,
  Param,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ModerationsService } from './moderations.service';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { UserStatus } from '@prisma/client';

@Controller('moderations')
export class ModerationsController {
  constructor(
    private readonly moderationsService: ModerationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post(':moderatedId')
  async create(
    @Param('moderatedId') moderatedId: number,
    @Req() req: Request,
  ): Promise<string> {
    // Check if moderated user exists
    if (!(await this.usersService.findOne({ id: moderatedId })))
      throw new NotFoundException('Moderated user not found');
    // Check if user already report moderated user
    if (await this.moderationsService.findOne(req.user.sub, moderatedId))
      throw new BadRequestException('You already moderated this user');
    // Record the moderate
    await this.moderationsService.create(req.user.sub, moderatedId);
    // Check if moderated user has to be banned
    const count = await this.moderationsService.calculateHowMany(moderatedId);
    if (count > 4)
      await this.usersService.updateStatus(moderatedId, UserStatus.BANNED);
    // Return success message
    return 'User successfully moderated';
  }
}
