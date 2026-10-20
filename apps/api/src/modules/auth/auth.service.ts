import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../../database/entities';
import {
  GenericRepository,
  InjectGenericRepository,
} from '../../database/repositories';
import { AuthResponseDto, UserRole, UserTokenPayload } from '@dzencode/contracts';
import { UserMapper } from '../../common/mappers';

@Injectable()
export class AuthService {
  constructor(
    @InjectGenericRepository(UserEntity)
    private readonly userRepo: GenericRepository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl: string;
  }): Promise<UserEntity> {
    const rawRepo = this.userRepo.getRawRepository();
    let user = await rawRepo.findOne({
      where: [{ googleId: data.googleId }, { email: data.email }],
    });

    if (!user) {
      const userCount = await this.userRepo.count();
      // First user is ADMIN, subsequent users default to MANAGER for testing CRUD operations
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.MANAGER;

      user = await this.userRepo.create({
        googleId: data.googleId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        role,
      });
    } else {
      let changed = false;
      if (data.avatarUrl && user.avatarUrl !== data.avatarUrl) {
        user.avatarUrl = data.avatarUrl;
        changed = true;
      }
      if (data.fullName && user.fullName !== data.fullName) {
        user.fullName = data.fullName;
        changed = true;
      }
      if (changed) {
        await rawRepo.save(user);
      }
    }

    return user;
  }

  generateAuthResponse(user: UserEntity): AuthResponseDto {
    const payload: UserTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: UserMapper.toDto(user),
    };
  }

  /**
   * Dev/Reviewer fallback login when Google Cloud Console keys are not configured
   */
  async devDemoLogin(email?: string): Promise<AuthResponseDto> {
    let user: UserEntity | null = null;
    if (email) {
      user = await this.userRepo.findOneWhere({ email });
    }
    if (!user && !email) {
      const all = await this.userRepo.findAll({ orderBy: { createdAt: 'ASC' }, take: 1 });
      user = all[0] || null;
    }
    if (!user) {
      user = await this.userRepo.create({
        googleId: email ? `demo-${email}` : 'demo-google-user-1',
        email: email || 'alex.khrystorozhdestvensky@gmail.com',
        fullName: email ? email.split('@')[0] : 'Христорождественский Александр',
        avatarUrl: '/static/7c9e6679-7425-40de-944b-e07fc1f90ae7.png',
        role: UserRole.MANAGER,
      });
    }
    return this.generateAuthResponse(user);
  }

  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }
    return user;
  }
}
