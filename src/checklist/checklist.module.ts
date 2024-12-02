import { Module } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { GroupsModule } from 'src/groups/groups.module';
import { StagesModule } from 'src/stages/stages.module';

@Module({
  imports: [GroupsModule, StagesModule],
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
