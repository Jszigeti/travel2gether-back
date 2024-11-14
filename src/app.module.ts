import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { StagesModule } from './stages/stages.module';
import { MediaModule } from './media/media.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ModerationsModule } from './moderations/moderations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RatingsModule } from './ratings/ratings.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    GroupsModule,
    StagesModule,
    MediaModule,
    ChecklistModule,
    ModerationsModule,
    NotificationsModule,
    RatingsModule,
    MessagesModule,
    PrismaModule,
  ],
})
export class AppModule {}
