import { forwardRef, Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { MulterModule } from '@nestjs/platform-express';
import { GroupsModule } from 'src/groups/groups.module';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extractFormatFromFile } from 'utils/extractFormatFromFile';
import { join } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads'),
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}.${extractFormatFromFile(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
    }),
    forwardRef(() => GroupsModule),
  ],

  controllers: [MediasController],
  providers: [MediasService],
  exports: [MediasService],
})
export class MediasModule {}
