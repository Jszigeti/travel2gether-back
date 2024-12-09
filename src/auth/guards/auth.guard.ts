import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { GroupsService } from 'src/groups/groups.service';
import { GroupWithMembers } from 'src/groups/interfaces/GroupWithMembers';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private readonly groupsService: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public decorator logic
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      process.env.IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;
    // Token decorator logic
    const tokenType: string =
      this.reflector.get<string>('tokenType', context.getHandler()) ||
      'accessToken';
    // Extract token from request
    const request = context.switchToHttp().getRequest();
    const token: string = request.cookies[tokenType];
    // If no token throw 401
    if (!token) throw new UnauthorizedException();
    // If token try to verify and store it in request
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret:
          tokenType === 'accessToken'
            ? process.env.SECRET_KEY
            : process.env.SECRET_REFRESH_KEY,
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
      // isMember decorator logic
      const groupId: number = this.reflector.get<number>(
        'isMember',
        context.getHandler(),
      );
      if (groupId) {
        // Check if group exists
        const group: GroupWithMembers = await this.groupsService.findOne({
          id: groupId,
        });
        if (!group) throw new NotFoundException('Group does not exist');
        // Check if the user is in group
        if (!this.groupsService.isUserInGroup(group, payload.sub))
          throw new ForbiddenException('User is not a member of the group');
      }
      request['token'] = token;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
