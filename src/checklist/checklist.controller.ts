import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { Request } from 'express';
import { GroupsService } from 'src/groups/groups.service';
import { StagesService } from 'src/stages/stages.service';
import { Checklist } from '@prisma/client';
import { IsMember } from 'src/groups/decorators/isMember.decorator';

@Controller('checklist')
export class ChecklistController {
  constructor(
    private readonly checklistService: ChecklistService,
    private readonly groupsService: GroupsService,
    private readonly stagesService: StagesService,
  ) {}

  @Post('groups/:groupId')
  async createGroupItem(
    @Body() body: CreateChecklistDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Record item
    await this.checklistService.create(body, groupId);
    // Return success message
    return 'Item successfully created';
  }

  @Post('groups/:groupId/stages/:stageId')
  async createStageItem(
    @Body() body: CreateChecklistDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('stageId', ParseIntPipe) stageId: number,
    @Req() req: Request,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Check if stage exists
    if (!(await this.stagesService.findOne(stageId)))
      throw new NotFoundException('Stage not found');
    // Record item
    await this.checklistService.create(body, groupId, stageId);
    // Return success message
    return 'Item successfully created';
  }

  @Get('groups/:groupId')
  @IsMember(Number(':groupId'))
  async findAllGroupItems(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Checklist[]> {
    // Return items
    return this.checklistService.findAllGroupItems(groupId);
  }

  @Get('groups/:groupId/stages/:stageId')
  @IsMember(Number(':groupId'))
  async findAllStageItems(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('stageId', ParseIntPipe) stageId: number,
  ): Promise<Checklist[]> {
    // Check if stage exist
    if (!(await this.stagesService.findOne(stageId)))
      throw new NotFoundException('Stage not found');
    // Return items
    return this.checklistService.findAllStageItems(groupId, stageId);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<string> {
    // Check if item exists
    const item = await this.checklistService.findOne(id);
    if (!item) throw new NotFoundException('Item not found');
    // Check if group exists
    const group = await this.groupsService.findOne({ id: item.groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Delete the item
    await this.checklistService.delete(id);
    // Return success message
    return 'Item successfully deleted';
  }
}
