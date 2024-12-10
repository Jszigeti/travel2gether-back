import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { ProfileDetails } from './interfaces/ProfileDetails';
import { Request } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediasService } from 'src/medias/medias.service';
import { fileValidationPipe } from 'src/medias/pipes/file-validation';
import { SearchUserDto } from './dto/search-user.dto';
import { Profile } from '@prisma/client';
import { UserAvatar } from './interfaces/userAvatar';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediasService: MediasService,
  ) {}

  @Public()
  @Get('profiles')
  async getLastProfiles(): Promise<UserAvatar[]> {
    return this.usersService.getLastProfiles();
  }

  // Search users
  @Public()
  @Get('search')
  async search(@Query() query: SearchUserDto) {
    return this.usersService.search(query);
  }

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
        throw new ForbiddenException("Old password don't match");
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
        throw new ForbiddenException('New email already exists');
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

  @UseInterceptors(FileInterceptor('file'))
  @Patch('/profile')
  async update(
    @Req() req: Request,
    @Body() body: UpdateProfileDto,
    @UploadedFile(fileValidationPipe) file?: Express.Multer.File,
  ): Promise<Profile> {
    // Check if user exists
    const profile = await this.usersService.findProfile({
      userId: req.user.sub,
    });
    if (!profile) throw new NotFoundException('User not found');
    // If file is uploaded
    if (file) {
      body.pathPicture = await this.mediasService.replaceMediaFileAndReturnPath(
        file,
        profile.pathPicture,
      );
    }
    // Update and return profile
    return this.usersService.updateProfile(req.user.sub, body);
  }
}
