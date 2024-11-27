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

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}
  create(createGroupDto: CreateGroupDto) {
    return 'This action adds a new group';
  }

  async search(query: {
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    travelTypes?: TravelTypes[];
    lodgings?: Lodgings[];
    budget?: Budget;
    languages?: Languages[];
    ageRanges?: AgeRanges[];
    gender?: GroupGender;

    page?: number; // Page actuelle
    limit?: number; // Nombre de résultats par page
  }): Promise<{ groups: Group[]; total: number }> {
    const filters = [];

    // Critère pour location (recherche partielle)
    if (query.location) {
      filters.push({
        location: {
          contains: query.location,
        },
      });
    }

    // Critère pour dateFrom (date minimale)
    if (query.dateFrom) {
      filters.push({ dateFrom: { gte: new Date(query.dateFrom) } });
    }

    // Critère pour dateTo (date maximale)
    if (query.dateTo) {
      filters.push({ dateTo: { lte: new Date(query.dateTo) } });
    }

    // Critère pour travelTypes (correspondance stricte pour chaque type)
    if (query.travelTypes?.length) {
      filters.push(
        ...query.travelTypes.map((type) => ({
          travelTypes: {
            some: { travelType: type },
          },
        })),
      );
    }

    // Critère pour lodgings (correspondance stricte pour chaque type)
    if (query.lodgings?.length) {
      filters.push(
        ...query.lodgings.map((lodging) => ({
          lodgings: {
            some: { lodging },
          },
        })),
      );
    }

    // Critère pour budget (simple correspondance)
    if (query.budget) {
      filters.push({ budget: query.budget });
    }

    // Critère pour languages (correspondance stricte pour chaque langue)
    if (query.languages?.length) {
      filters.push(
        ...query.languages.map((language) => ({
          languages: {
            some: { language },
          },
        })),
      );
    }

    // Critère pour ageRanges (correspondance stricte pour chaque tranche d'âge)
    if (query.ageRanges?.length) {
      filters.push(
        ...query.ageRanges.map((ageRange) => ({
          ageRanges: {
            some: { ageRange },
          },
        })),
      );
    }

    // Critère pour gender (simple correspondance)
    if (query.gender) {
      filters.push({ gender: query.gender });
    }

    // Gestion de la pagination
    const page = query.page || 1; // Par défaut, page 1
    const limit = query.limit || 10; // Par défaut, 10 résultats par page
    const skip = (page - 1) * limit;

    // Récupérer les résultats avec pagination
    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where: {
          AND: filters,
        },
        skip,
        take: limit,
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
