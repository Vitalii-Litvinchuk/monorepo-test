import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupEntity } from '../../database/entities';
import {
  GenericRepository,
  InjectGenericRepository,
} from '../../database/repositories';
import { Group } from '@dzencode/contracts';
import { GroupMapper } from '../../common/mappers';

@Injectable()
export class GroupsService {
  constructor(
    @InjectGenericRepository(GroupEntity)
    private readonly groupRepo: GenericRepository<GroupEntity>,
  ) {}

  async findAll(): Promise<Group[]> {
    const groups = await this.groupRepo.findAll({
      relations: ['products'],
      orderBy: { title: 'ASC' },
    });

    return groups.map(GroupMapper.toDto);
  }

  async findOne(id: string): Promise<Group> {
    const g = await this.groupRepo.findOneById(id, ['products']);
    if (!g) {
      throw new NotFoundException(`Групу з ID ${id} не знайдено`);
    }
    return GroupMapper.toDto(g);
  }
}
