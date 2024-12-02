import { Injectable } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Rating } from '@prisma/client';

@Injectable()
export class RatingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    value: number,
    raterId: number,
    ratedId: number,
  ): Promise<Rating> {
    return this.prismaService.rating.create({
      data: { value, raterId, ratedId },
    });
  }

  async findOne(raterId: number, ratedId: number) {
    return this.prismaService.rating.findUnique({
      where: { raterId_ratedId: { ratedId, raterId } },
    });
  }
}
