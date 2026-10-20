import { GroupEntity } from '../../database/entities';
import { Group } from '@dzencode/contracts';

export class GroupMapper {
  static toDto(g: GroupEntity): Group {
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      productsCount: g.products?.length || 0,
    };
  }
}
