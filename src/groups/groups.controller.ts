import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import {
  AgeRanges,
  Budget,
  Group,
  GroupGender,
  Languages,
  Lodgings,
  TravelTypes,
} from '@prisma/client';
import { Public } from 'src/auth/decorators/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private prisma: PrismaService,
  ) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Public()
  @Get('test-relations')
  async testRelations() {
    try {
      const groups = await this.prisma.group.findMany({
        where: {
          AND: [
            {
              travelTypes: {
                some: {
                  travelType: 'RELAXATION', // Remplace par une valeur valide
                },
              },
            },
            {
              lodgings: {
                some: {
                  lodging: 'HOTEL', // Remplace par une valeur valide
                },
              },
            },
          ],
        },
      });

      return groups;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  @Public()
  @Get('search')
  async search(
    @Query()
    query: {
      location?: string;
      dateFrom?: string;
      dateTo?: string;
      travelTypes?: string | string[]; // Accepte une chaîne ou un tableau
      lodgings?: string | string[];
      budget?: string;
      languages?: string | string[];
      ageRanges?: string | string[];
      gender?: string;

      page?: string; // La page actuelle (optionnel)
      limit?: string; // Le nombre de résultats par page (optionnel)
    },
  ) {
    // Convertir les champs en tableau si nécessaire
    const toArray = (value: string | string[] | undefined): string[] =>
      Array.isArray(value) ? value : value ? value.split(',') : [];

    const convertedQuery = {
      ...query,
      travelTypes: toArray(query.travelTypes).map(
        (type) => type as TravelTypes,
      ),
      lodgings: toArray(query.lodgings).map((lodging) => lodging as Lodgings),
      languages: toArray(query.languages).map((lang) => lang as Languages),
      ageRanges: toArray(query.ageRanges).map((range) => range as AgeRanges),
      budget: query.budget as Budget,
      gender: query.gender as GroupGender,

      page: parseInt(query.page || '1', 10), // Page par défaut : 1
      limit: parseInt(query.limit || '10', 10), // Limite par défaut : 10
    };

    return this.groupsService.search(convertedQuery);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(+id);
  }
}
