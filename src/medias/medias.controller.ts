import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  Req,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  NotFoundException,
} from '@nestjs/common';
import { MediasService } from './medias.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Media } from '@prisma/client';
import { GroupsService } from 'src/groups/groups.service';
import { fileValidationPipe } from './pipes/file-validation';

@Controller()
export class MediasController {
  constructor(
    private readonly mediasService: MediasService,
    private readonly groupsService: GroupsService,
  ) {}

  @Post('groups/:groupId/medias')
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
    // Check if group exists and if user is in it
    await this.groupsService.isUserInGroup(groupId, req.user.sub);
    // Create the media path and save the media on server
    const path = await this.mediasService.saveNewFileAndReturnPath(
      file,
      groupId,
    );
    // Save in DB and return it
    return this.mediasService.saveToDatabase(path, alt, groupId, req.user.sub);
  }

  @Get('groups/:groupId/medias')
  async findAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<Media[]> {
    // Check if group exists and if user is in it
    await this.groupsService.isUserInGroup(groupId, req.user.sub);
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
    // Check if group exists and if user is authorized to delete media
    await this.groupsService.canDeleteMedia(media, req.user.sub);
    // Delete the physique media
    await this.mediasService.deleteFile(media.path);
    // Delete the media from DB
    await this.mediasService.delete({ id });
    // Return success message
    return 'Media successfully deleted';
  }
}
