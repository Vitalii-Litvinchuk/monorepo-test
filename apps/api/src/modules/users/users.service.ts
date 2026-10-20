import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from '../../database/entities';
import {
  GenericRepository,
  InjectGenericRepository,
} from '../../database/repositories';
import { User } from '@dzencode/contracts';
import { UserMapper } from '../../common/mappers';

@Injectable()
export class UsersService {
  constructor(
    @InjectGenericRepository(UserEntity)
    private readonly userRepo: GenericRepository<UserEntity>,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.userRepo.findAll({
      orderBy: { fullName: 'ASC' },
    });

    return users.map(UserMapper.toDto);
  }

  async findOne(id: string): Promise<User> {
    const u = await this.userRepo.findOneById(id);
    if (!u) {
      throw new NotFoundException(`Користувача з ID ${id} не знайдено`);
    }
    return UserMapper.toDto(u);
  }
}
