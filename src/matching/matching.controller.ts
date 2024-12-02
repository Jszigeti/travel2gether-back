import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { Request } from 'express';

@Controller('match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('groups')
  async matchGroups(@Req() req: Request) {
    return this.matchingService.matchGroups(req.user.sub);
  }

  @Get('users')
  async matchUsers(@Req() req: Request) {
    return this.matchingService.matchUsers(req.user.sub);
  }
}
