import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from '../../database/entities';
import { GroupsController } from './groups.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GroupEntity])],
  controllers: [GroupsController],
})
export class GroupsModule {}
