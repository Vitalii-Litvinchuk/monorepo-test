import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';
import { User } from '@dzencode/contracts';

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  @Get()
  async findAll(): Promise<User[]> {
    const users = await this.userRepo.find({
      order: { fullName: 'ASC' },
    });

    return users.map((u) => ({
      id: u.id,
      googleId: u.googleId,
      email: u.email,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User | null> {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) return null;
    return {
      id: u.id,
      googleId: u.googleId,
      email: u.email,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    };
  }
}
