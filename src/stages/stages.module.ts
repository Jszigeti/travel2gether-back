import { Module } from '@nestjs/common';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';
import { GroupsModule } from 'src/groups/groups.module';
import { MediasModule } from 'src/medias/medias.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    GroupsModule,
    NotificationsModule,
    MediasModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}-${file.originalname}`;
          callback(null, uniqueName);
        },
      }),
    }),
  ],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
