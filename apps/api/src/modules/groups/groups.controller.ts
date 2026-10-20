import { Controller, Get, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from '@dzencode/contracts';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(): Promise<Group[]> {
    return this.groupsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Group | null> {
    return this.groupsService.findOne(id);
  }
}
