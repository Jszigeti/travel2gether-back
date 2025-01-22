import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { UsersModule } from 'src/users/users.module';
import { GroupsModule } from 'src/groups/groups.module';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  imports: [UsersModule, GroupsModule],
})
export class MessagesModule {}
