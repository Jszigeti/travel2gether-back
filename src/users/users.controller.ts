import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { ProfileDetails } from './interfaces/ProfileDetails';
import { Request } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // User endpoints
  @Patch()
  async updateUser(
    @Req() req: Request,
    @Body() body: UpdateUserDto,
  ): Promise<string> {
    // Check if user exists
    const user = await this.usersService.findOne({ id: req.user.sub });
    if (!user) throw new NotFoundException('User not found');
    // If password update check if old password match
    if (body.password) {
      if (!(await bcrypt.compare(body.oldPassword, user.password)))
        throw new UnauthorizedException("Old password don't match");
      body = { ...body, password: await bcrypt.hash(body.password, 10) };
    }
    // Remove oldPassword from body
    const { oldPassword, ...updatedBody } = body;
    // If email update check if email already exists
    if (body.email) {
      const existingUser = await this.usersService.findOne({
        email: body.email,
      });
      if (existingUser && existingUser.id !== req.user.sub)
        throw new UnauthorizedException('New email already exists');
    }
    // Update user and return success message
    return this.usersService.update(req.user.sub, updatedBody);
  }

  @Delete()
  async deleteUser(@Req() req: Request): Promise<string> {
    // Check if user exists
    if (!(await this.usersService.findProfile({ userId: req.user.sub })))
      throw new NotFoundException('User not found');
    // Delete user and return success message
    return this.usersService.delete(req.user.sub);
  }

  // Profile endpoints
  @Public()
  @Get(':userId/profile')
  async getOne(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ProfileDetails> {
    const profile = await this.usersService.getProfile({ userId });
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  @Patch('/profile')
  async update(
    @Req() req: Request,
    @Body() body: UpdateProfileDto,
  ): Promise<string> {
    // Check if user exists
    if (!(await this.usersService.findProfile({ userId: req.user.sub })))
      throw new NotFoundException('User not found');
    // Update profile and return success message
    return this.usersService.updateProfile(req.user.sub, body);
  }
}
