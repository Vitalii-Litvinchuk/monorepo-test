import { UserEntity } from '../../database/entities';
import { User } from '@dzencode/contracts';

export class UserMapper {
  static toDto(u: UserEntity): User {
    return {
      id: u.id,
      googleId: u.googleId,
      email: u.email,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      createdAt: u.createdAt ? u.createdAt.toISOString() : '',
    };
  }
}
