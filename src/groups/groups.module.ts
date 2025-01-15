import { forwardRef, Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { MediasModule } from 'src/medias/medias.module';
import { v4 as uuidv4 } from 'uuid';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
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
    forwardRef(() => MediasModule),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
