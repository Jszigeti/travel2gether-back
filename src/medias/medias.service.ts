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
  async deleteFile(path: string): Promise<void> {
    return fs.unlink(path);
  }

  // Utils functions
  async replaceMediaFileAndReturnPath(
    file: Express.Multer.File,
    path: string | undefined,
  ): Promise<string> {
    if (path) {
      await this.deleteFile(path);
    }
    return `uploads/${file.filename}`;
  }
}
