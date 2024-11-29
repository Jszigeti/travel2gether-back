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
  BadRequestException,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Request } from 'express';
import { Rating } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

@Controller('ratings')
export class RatingsController {
  constructor(
    private readonly ratingsService: RatingsService,
    private readonly usersService: UsersService,
  ) {}

  @Post(':ratedId')
  async create(
    @Body() createRatingDto: CreateRatingDto,
    @Param('ratedId', ParseIntPipe) ratedId: number,
    @Req() req: Request,
  ): Promise<string> {
    // Check if rated user exists
    if (!(await this.usersService.findOne({ id: ratedId })))
      throw new NotFoundException('User not found');
    // Check if user already rate the rated user
    if (await this.ratingsService.findOne(req.user.sub, ratedId))
      throw new BadRequestException('You already rated this user');
    // Record the rate
    await this.ratingsService.create(
      createRatingDto.value,
      req.user.sub,
      ratedId,
    );
    // Return success message
    return 'User successfully rated';
  }
}
