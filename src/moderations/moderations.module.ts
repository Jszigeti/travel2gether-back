import { Module } from '@nestjs/common';
import { ModerationsService } from './moderations.service';
import { ModerationsController } from './moderations.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ModerationsController],
  providers: [ModerationsService],
})
export class ModerationsModule {}
