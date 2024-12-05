import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public decorator logic
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      process.env.IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;
    // Token decorator logic
    const tokenType =
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
        secret: process.env.SECRET_KEY,
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
      request['token'] = token;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
