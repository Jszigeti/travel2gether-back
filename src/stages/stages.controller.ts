import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  NotFoundException,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { StagesService } from './stages.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Request } from 'express';
import { GroupsService } from 'src/groups/groups.service';
import { MediasService } from 'src/medias/medias.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileValidationPipe } from 'src/medias/pipes/file-validation';
import { NotificationReferenceType, Stage } from '@prisma/client';

@Controller()
export class StagesController {
  constructor(
    private readonly stagesService: StagesService,
    private readonly groupsService: GroupsService,
    private readonly notificationsService: NotificationsService,
    private readonly mediasService: MediasService,
  ) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post('groups/:groupId/stages')
  async create(
    @Body() body: CreateStageDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
    @UploadedFile(fileValidationPipe) file: Express.Multer.File,
  ): Promise<Stage> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new UnauthorizedException('You are not allowed');
    // Save picture
    body.pathPicture = await this.mediasService.saveNewFileAndReturnPath(
      file,
      Date.now(),
    );
    // Create stage
    const stage = await this.stagesService.create(body, groupId);
    // If group members > 1, notification to all members
    await this.notificationsService.createToAllMembers(
      group,
      req.user.sub,
      NotificationReferenceType.GROUP_MODIFICATION,
      `L'étape ${stage.title} a été ajoutée au groupe ${group.title}.`,
    );
    // Return stage
    return stage;
  }

  @Public()
  @Get('groups/:groupId/stages')
  async findAll(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Partial<Stage>[]> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Return stages (id, title, dateFrom, dateTo)
    return await this.stagesService.findAll(groupId);
  }

  @Get('groups/:groupId/stages/:stageId')
  async findOne(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('stageId', ParseIntPipe) stageId: number,
    @Req() req: Request,
  ): Promise<Stage> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is in group
    if (!this.groupsService.isUserInGroup(group, req.user.sub))
      throw new UnauthorizedException('You are not allowed');
    // Check if stage exist
    if (!(await this.stagesService.findOne(stageId)))
      throw new NotFoundException('Stage not found');
    // Return stage (all datas)
    return this.stagesService.findOne(stageId);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Patch('groups/:groupId/stages/:stageId')
  async update(
    @Body() body: UpdateStageDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('stageId', ParseIntPipe) stageId: number,
    @Req() req: Request,
    @UploadedFile(fileValidationPipe) file?: Express.Multer.File,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new UnauthorizedException('You are not allowed');
    // Check if stage exist
    const stage = await this.stagesService.findOne(stageId);
    if (!stage) throw new NotFoundException('Stage not found');
    // Save picture if picture
    if (file) {
      body.pathPicture = await this.mediasService.replaceMediaFileAndReturnPath(
        stageId,
        file,
        stage.pathPicture,
      );
    }
    // Update stage
    await this.stagesService.update(stageId, body);
    // If group members > 1, notification to all members
    await this.notificationsService.createToAllMembers(
      group,
      req.user.sub,
      NotificationReferenceType.GROUP_MODIFICATION,
      `L'étape ${stage.title} du ${group.title} a été modifiée par un organisateur.`,
    );
    // Return success message
    return 'Stage successfully updated';
  }

  @Delete('groups/:groupId/stages/:stageId')
  async delete(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('stageId', ParseIntPipe) stageId: number,
    @Req() req: Request,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new UnauthorizedException('You are not allowed');
    // Check if stage exist
    const stage = await this.stagesService.findOne(stageId);
    if (!stage) throw new NotFoundException('Stage not found');
    // Delete stage
    await this.stagesService.delete(stageId);
    // If group members > 1, notification to all members
    await this.notificationsService.createToAllMembers(
      group,
      req.user.sub,
      NotificationReferenceType.GROUP_MODIFICATION,
      `L'étape ${stage.title} du ${group.title} a été supprimée.`,
    );
    // Return success message
    return 'Stage successfully deleted';
  }
}
