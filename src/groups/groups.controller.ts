import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Query,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Request } from 'express';
import {
  Group,
  GroupRole,
  GroupUser,
  GroupUserStatus,
  NotificationReferenceType,
} from '@prisma/client';
import { Public } from 'src/auth/decorators/public.decorator';
import { GroupWithMembersAndStages } from './interfaces/GroupWithMembersAndStages';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SearchGroupDto } from './dto/search-group.dto';
import { fileValidationPipe } from 'src/medias/pipes/file-validation';
import { MediasService } from 'src/medias/medias.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly notificationsService: NotificationsService,
    private readonly mediasService: MediasService,
  ) {}

  // Group endpoints
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateGroupDto,
    @UploadedFile(fileValidationPipe) file: Express.Multer.File,
  ): Promise<Group> {
    body.pathPicture = `uploads/${file.filename}`;
    return this.groupsService.create(body, req.user.sub);
  }

  @Public()
  @Get('search')
  async search(@Query() query: SearchGroupDto) {
    return this.groupsService.search(query);
  }

  @Public()
  @Get(':groupId')
  async getOne(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<GroupWithMembersAndStages> {
    const group = await this.groupsService.getOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  @UseInterceptors(FileInterceptor('file'))
  @Patch(':groupId')
  async update(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() body: UpdateGroupDto,
    @UploadedFile(fileValidationPipe) file?: Express.Multer.File,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // If file is uploaded
    if (file) {
      body.pathPicture = await this.mediasService.replaceMediaFileAndReturnPath(
        file,
        group.pathPicture,
      );
    }
    // Update group
    await this.groupsService.update(groupId, body);
    // Create notification for group members if members > 1
    await this.notificationsService.createToAllMembers(
      group,
      req.user.sub,
      NotificationReferenceType.GROUP_MODIFICATION,
      `Le groupe ${group.title} a été modifié par un organisateur.`,
    );
    // Return success message
    return 'Group successfully updated';
  }

  @Delete(':groupId')
  async delete(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is author
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub, true))
      throw new ForbiddenException('You are not allowed');
    // Delete group
    await this.groupsService.delete(groupId);
    // Create notification for group members if members > 1
    await this.notificationsService.createToAllMembers(
      group,
      req.user.sub,
      NotificationReferenceType.GROUP_DELETE,
      `Le groupe ${group.title} a été supprimé.`,
    );
    // Return success message
    return 'Group successfully deleted';
  }

  // Group manage endpoints
  @Post(':groupId/users/:userId')
  async inviteMember(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Update groupe dans return success message
    await this.groupsService.inviteMember(groupId, userId);
    // Create notification for invited user
    await this.notificationsService.create(
      userId,
      groupId,
      NotificationReferenceType.GROUP_INVITATION,
      `Vous avez été invité à rejoindre le groupe ${group.title}.`,
    );
    // Return success message
    return 'Member successfully invited';
  }

  @Get(':groupId/users')
  async getMembers(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<GroupUser[]> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Return members
    return this.groupsService.getMembers(groupId);
  }

  @Patch(':groupId/users/:userId/accept')
  async acceptMember(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Check if member exists in group
    if (group.members.some((member) => member.userId !== userId))
      throw new NotFoundException('Member not found');
    // Update member status
    await this.groupsService.manageMemberStatus(
      groupId,
      userId,
      GroupUserStatus.ACCEPTED,
    );
    // Create notification for updated user
    await this.notificationsService.create(
      userId,
      groupId,
      NotificationReferenceType.GROUP_INVITATION,
      `Vous avez rejoint le groupe ${group.title}.`,
    );
    // Return success message
    return 'Member status successfully updated';
  }

  @Patch(':groupId/users/:userId/kick')
  async kickMember(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string> {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Check if member exists in group
    if (group.members.some((member) => member.userId !== userId))
      throw new NotFoundException('Member not found');
    // Update member status
    await this.groupsService.manageMemberStatus(
      groupId,
      userId,
      GroupUserStatus.DENIED,
    );
    // Create notification for updated user
    await this.notificationsService.create(
      userId,
      groupId,
      NotificationReferenceType.GROUP_STATUS_UPDATE,
      `Votre demande d'adhésion ou votre participation au groupe ${group.title} a été mise à jour. Vous n'êtes plus membre du groupe.`,
    );
    // Return success message
    return 'Member status successfully updated';
  }

  @Patch(':groupId/users/:userId/:role')
  async manageMemberRole(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('role') role: string,
  ): Promise<string> {
    // Check if role is valid
    if (!Object.values(GroupRole).includes(role as GroupRole)) {
      throw new BadRequestException('Invalid role');
    }
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user is authorized
    if (!this.groupsService.IsUserAuthorized(group, req.user.sub))
      throw new ForbiddenException('You are not allowed');
    // Check if member exists in group
    if (group.members.some((member) => member.userId !== userId))
      throw new NotFoundException('Member not found');
    // Update member and return success message
    await this.groupsService.manageMemberRole(
      groupId,
      userId,
      role as GroupRole,
    );
    // Create notification for updated user
    await this.notificationsService.create(
      userId,
      groupId,
      NotificationReferenceType.GROUP_ROLE_UPDATE,
      `Votre rôle au sein du groupe ${group.title} a été modifié.`,
    );
    // Return success message
    return 'User role successfully updated';
  }

  // User interactions with group endpoints
  @Post(':groupId/users')
  async sendRequest(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Create group request
    await this.groupsService.sendRequest(groupId, req.user.sub);
    // Create notification for organizers and author
    await this.notificationsService.createToAuthorAndOrganizers(
      group,
      NotificationReferenceType.GROUP_REQUEST,
      `Un nouvel utilisateur souhaite rejoindre le groupe ${group.title}.`,
    );
    // Return success message
    return 'Request successfully sended';
  }

  @Patch(':groupId/users')
  async acceptInvitation(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user exists in group
    if (group.members.some((member) => member.userId !== req.user.sub))
      throw new NotFoundException('User not found');
    // Accept group invitation
    await this.groupsService.manageMemberStatus(
      groupId,
      req.user.sub,
      GroupUserStatus.ACCEPTED,
    );
    // Create notification for organizers and author
    await this.notificationsService.createToAuthorAndOrganizers(
      group,
      NotificationReferenceType.GROUP_NEW_MEMBER,
      `Un nouveau membre a rejoint le groupe ${group.title}.`,
    );
    // Return success message
    return 'Invitation successfully accepted';
  }

  @Delete(':groupId/users')
  async denyInvitation(
    @Req() req: Request,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    // Check if group exists
    const group = await this.groupsService.findOne({ id: groupId });
    if (!group) throw new NotFoundException('Group not found');
    // Check if user exists in group
    if (group.members.some((member) => member.userId !== req.user.sub))
      throw new NotFoundException('User not found');
    // Deny group invitation
    await this.groupsService.denyInvitation(groupId, req.user.sub);
    // Return success message
    return 'Invitation successfully denied';
  }
}
