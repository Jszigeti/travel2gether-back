import { Module } from '@nestjs/common';
import { ModerationsService } from './moderations.service';
import { ModerationsController } from './moderations.controller';

@Module({
  controllers: [ModerationsController],
  providers: [ModerationsService],
})
export class ModerationsModule {}
