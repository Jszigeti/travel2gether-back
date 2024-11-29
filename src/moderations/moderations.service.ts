import { Injectable } from '@nestjs/common';
import { Moderating } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ModerationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(moderaterId: number, moderatedId: number): Promise<Moderating> {
    return this.prismaService.moderating.create({
      data: { moderaterId, moderatedId },
    });
  }

  async findOne(moderaterId: number, moderatedId: number): Promise<Moderating> {
    return this.prismaService.moderating.findUnique({
      where: { moderaterId_moderatedId: { moderaterId, moderatedId } },
    });
  }

  async calculateHowMany(moderatedId: number): Promise<number> {
    return this.prismaService.moderating.count({
      where: { moderatedId },
    });
  }
}
