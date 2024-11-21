import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { ProfileDetails } from './interfaces/ProfileDetails';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get(':userId/profile')
  async findProfile(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ProfileDetails> {
    const profile = await this.usersService.findProfile(userId);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }
}
