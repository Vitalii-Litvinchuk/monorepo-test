import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupEntity } from '../../database/entities';
import {
  GenericRepository,
  InjectGenericRepository,
} from '../../database/repositories';
import { Group, WS_EVENTS } from '@dzencode/contracts';
import { GroupMapper } from '../../common/mappers';
import { CreateGroupDtoClass } from './dto/create-group.dto';
import { UpdateGroupDtoClass } from './dto/update-group.dto';
import { SessionsGateway } from '../sessions/sessions.gateway';

@Injectable()
export class GroupsService {
  constructor(
    @InjectGenericRepository(GroupEntity)
    private readonly groupRepo: GenericRepository<GroupEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly sessionsGateway: SessionsGateway,
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

  async create(dto: CreateGroupDtoClass): Promise<Group> {
    const group = await this.groupRepo.create({
      title: dto.title,
      description: dto.description || '',
      products: [],
    });

    const result = GroupMapper.toDto(group);
    this.eventEmitter.emit(WS_EVENTS.GROUP_CREATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.GROUP_CREATED, result);

    return result;
  }

  async update(id: string, dto: UpdateGroupDtoClass): Promise<Group> {
    const existing = await this.groupRepo.findOneById(id);
    if (!existing) {
      throw new NotFoundException(`Групу з ID ${id} не знайдено`);
    }

    const updated = await this.groupRepo.update(id, dto, ['products']);
    if (!updated) {
      throw new NotFoundException(`Групу з ID ${id} не знайдено`);
    }

    const result = GroupMapper.toDto(updated);
    this.eventEmitter.emit(WS_EVENTS.GROUP_UPDATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.GROUP_UPDATED, result);

    return result;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.groupRepo.findOneById(id);
    if (!existing) {
      throw new NotFoundException(`Групу з ID ${id} не знайдено`);
    }

    await this.groupRepo.delete(id);

    const payload = { groupId: id, timestamp: new Date().toISOString() };
    this.eventEmitter.emit(WS_EVENTS.GROUP_DELETED, payload);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.GROUP_DELETED, payload);

    return { success: true, id };
  }
}
