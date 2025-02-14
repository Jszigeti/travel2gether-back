import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  ParseIntPipe,
  Req,
  BadRequestException,
  NotFoundException,
  Get,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Media } from '@prisma/client';
import { GroupsService } from 'src/groups/groups.service';
import { MediasService } from './medias.service';
import { fileValidationPipe } from './pipes/file-validation';
import { Request } from 'express';
import { IsMember } from 'src/groups/decorators/isMember.decorator';

@Controller()
export class MediasController {
  constructor(
    private readonly mediasService: MediasService,
    private readonly groupsService: GroupsService,
  ) {}

  @Post('groups/:groupId/medias')
  @IsMember(Number(':groupId'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadGroupFile(
    @UploadedFile(fileValidationPipe) file: Express.Multer.File,
    @Body('alt') alt: string,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<Media> {
    // Check if file
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // Create the media path and save the media on server
    const path = `uploads/${file.filename}`;
    // Save in DB and return it
    return this.mediasService.saveToDatabase(path, alt, groupId, req.user.sub);
  }

  @Get('groups/:groupId/medias')
  @IsMember(Number(':groupId'))
  async findAll(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Media[]> {
    // Return medias
    return this.mediasService.findAll(groupId);
  }

  @Delete('groups/:groupId/medias/:mediaId')
  async delete(
    @Param('mediaId', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<string> {
    // Check if media exists
    const media = await this.mediasService.findOne({ id });
    if (!media) throw new NotFoundException('Media not found');
    // Check if group exists
    const group = await this.groupsService.findOne({ id: media.groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user can delete media
    if (!this.groupsService.canDeleteMedia(group, media, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Delete the physique media
    await this.mediasService.deleteFile(media.path);
    // Delete the media from DB
    await this.mediasService.delete({ id });
    // Return success message
    return 'Media successfully deleted';
  }
}
