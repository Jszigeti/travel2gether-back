import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AgeRanges,
  Budget,
  Group,
  GroupGender,
  Languages,
  Lodgings,
  TravelTypes,
} from '@prisma/client';
import { SearchGroupDto } from './dto/search-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}
  create(createGroupDto: CreateGroupDto) {
    return 'This action adds a new group';
  }

  async search(
    query: SearchGroupDto,
  ): Promise<{ groups: Group[]; total: number }> {
    const filters = [];

    // Ajout des critères dynamiques via une fonction utilitaire
    const addFilter = (field: string, values: string[], column: string) => {
      if (values?.length) {
        filters.push({
          OR: values.map((value) => ({
            [field]: {
              some: { [column]: value },
            },
          })),
        });
      }
    };

    // Critère pour location (recherche partielle)
    if (query.location) {
      filters.push({
        location: {
          contains: query.location,
        },
      });
    }

    // Filtre pour dateFrom > aujourd'hui
    filters.push({ dateFrom: { gte: new Date() } });

    // Critère pour dateFrom (date minimale fournie par l'utilisateur)
    if (query.dateFrom) {
      filters.push({ dateFrom: { gte: new Date(query.dateFrom) } });
    }

    // Critère pour dateTo (date maximale fournie par l'utilisateur)
    if (query.dateTo) {
      filters.push({ dateTo: { lte: new Date(query.dateTo) } });
    }

    // Critères pour travelTypes, lodgings, languages, ageRanges
    addFilter('travelTypes', query.travelTypes, 'travelType');
    addFilter('lodgings', query.lodgings, 'lodging');
    addFilter('languages', query.languages, 'language');
    addFilter('ageRanges', query.ageRanges, 'ageRange');

    // Critères simples pour budget et gender
    if (query.budget) {
      filters.push({ budget: query.budget });
    }
    if (query.gender) {
      filters.push({ gender: query.gender });
    }

    // Gestion de la pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Récupérer les résultats avec pagination et tri
    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where: {
          AND: filters,
        },
        skip,
        take: limit,
        orderBy: { dateFrom: 'asc' }, // Trie par dateFrom, de la plus proche à la plus éloignée
      }),
      this.prisma.group.count({
        where: {
          AND: filters,
        },
      }),
    ]);

    return { groups, total };
  }

  findAll() {
    return `This action returns all groups`;
  }

  findOne(id: number) {
    return `This action returns a #${id} group`;
  }

  update(id: number, updateGroupDto: UpdateGroupDto) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
