import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Media, Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class MediasService {
  constructor(private readonly prismaService: PrismaService) {}

  // Media path functions
  async saveToDatabase(
    path: string,
    alt: string,
    groupId: number,
    userId: number,
  ): Promise<Media> {
    return this.prismaService.media.create({
      data: { path, alt, groupId, userId },
    });
  }

  async findAll(groupId: number) {
    return this.prismaService.media.findMany({ where: { groupId } });
  }

  async findOne(
    mediaWhereUniqueInput: Prisma.MediaWhereUniqueInput,
  ): Promise<Media> {
    return this.prismaService.media.findUnique({
      where: mediaWhereUniqueInput,
    });
  }

  async delete(
    mediaWhereUniqueInput: Prisma.MediaWhereUniqueInput,
  ): Promise<Media> {
    return this.prismaService.media.delete({ where: mediaWhereUniqueInput });
  }

  // File functions
  async saveFile(file: Express.Multer.File, fileName: string) {
    return fs.rename(file.path, join('uploads', fileName));
  }

  async deleteFile(path: string): Promise<void> {
    const filePath = join('uploads', path);
    return fs.unlink(filePath);
  }

  // Utils functions
  async saveNewFileAndReturnPath(
    file: Express.Multer.File,
    id: number,
  ): Promise<string> {
    // Create the file name
    const fileName = `${id}-${file.originalname}`;
    // Save the media on the server
    await this.saveFile(file, fileName);
    // Return media path
    return `uploads/${fileName}`;
  }

  async replaceMediaFileAndReturnPath(
    referenceId: number,
    file: Express.Multer.File,

    path: string | undefined,
  ): Promise<string> {
    if (path) {
      await this.deleteFile(path);
    }
    return await this.saveNewFileAndReturnPath(file, referenceId);
  }
}
