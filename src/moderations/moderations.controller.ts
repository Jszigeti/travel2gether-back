import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ModerationsService } from './moderations.service';
import { CreateModerationDto } from './dto/create-moderation.dto';
import { UpdateModerationDto } from './dto/update-moderation.dto';

@Controller('moderations')
export class ModerationsController {
  constructor(private readonly moderationsService: ModerationsService) {}

  @Post()
  create(@Body() createModerationDto: CreateModerationDto) {
    return this.moderationsService.create(createModerationDto);
  }

  @Get()
  findAll() {
    return this.moderationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moderationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateModerationDto: UpdateModerationDto) {
    return this.moderationsService.update(+id, updateModerationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moderationsService.remove(+id);
  }
}
