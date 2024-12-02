import { Injectable } from '@nestjs/common';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Stage } from '@prisma/client';

@Injectable()
export class StagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: CreateStageDto, groupId: number): Promise<Stage> {
    return this.prismaService.stage.create({
      data: { ...body, groupId },
    });
  }

  async findAll(groupId: number): Promise<Partial<Stage>[]> {
    return this.prismaService.stage.findMany({
      where: { groupId },
      select: { id: true, title: true, dateFrom: true, dateTo: true },
    });
  }

  async findOne(id: number): Promise<Stage> {
    return this.prismaService.stage.findUnique({ where: { id } });
  }

  async update(id: number, body: UpdateStageDto): Promise<Stage> {
    return this.prismaService.stage.update({
      where: { id },
      data: body,
    });
  }

  async delete(id: number): Promise<Stage> {
    return this.prismaService.stage.delete({ where: { id } });
  }
}
