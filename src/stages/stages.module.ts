import { Module } from '@nestjs/common';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';
import { GroupsModule } from 'src/groups/groups.module';
import { MediasModule } from 'src/medias/medias.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [GroupsModule, NotificationsModule, MediasModule],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
