import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { StagesModule } from './stages/stages.module';
import { MediasModule } from './medias/medias.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ModerationsModule } from './moderations/moderations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RatingsModule } from './ratings/ratings.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    GroupsModule,
    StagesModule,
    MediasModule,
    ChecklistModule,
    ModerationsModule,
    NotificationsModule,
    RatingsModule,
    MessagesModule,
    PrismaModule,
    EmailModule,
    MatchingModule,
  ],
})
export class AppModule {}
