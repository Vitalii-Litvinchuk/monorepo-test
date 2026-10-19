import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from '../../database/entities';
import { Group } from '@dzencode/contracts';

@Controller('groups')
export class GroupsController {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
  ) {}

  @Get()
  async findAll(): Promise<Group[]> {
    const groups = await this.groupRepo.find({
      relations: ['products'],
      order: { title: 'ASC' },
    });

    return groups.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      productsCount: g.products?.length || 0,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Group | null> {
    const g = await this.groupRepo.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!g) return null;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      productsCount: g.products?.length || 0,
    };
  }
}
