import { Injectable } from '@nestjs/common';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Checklist } from '@prisma/client';

@Injectable()
export class ChecklistService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    body: CreateChecklistDto,
    groupId: number,
    stageId?: number,
  ): Promise<Checklist> {
    return this.prismaService.checklist.create({
      data: { item: body.item, groupId, stageId },
    });
  }

  async findAllGroupItems(groupId: number): Promise<Checklist[]> {
    return this.prismaService.checklist.findMany({
      where: { groupId, stageId: null },
    });
  }

  async findAllStageItems(
    groupId: number,
    stageId: number,
  ): Promise<Checklist[]> {
    return this.prismaService.checklist.findMany({
      where: { groupId, stageId },
    });
  }

  async findOne(id: number): Promise<Checklist> {
    return this.prismaService.checklist.findUnique({ where: { id } });
  }

  async delete(id: number): Promise<Checklist> {
    return this.prismaService.checklist.delete({ where: { id } });
  }
}
