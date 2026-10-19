import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';
import { AuthResponseDto, UserRole, UserTokenPayload } from '@dzencode/contracts';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl: string;
  }): Promise<UserEntity> {
    let user = await this.userRepo.findOne({
      where: [{ googleId: data.googleId }, { email: data.email }],
    });

    if (!user) {
      const userCount = await this.userRepo.count();
      // First user is ADMIN, subsequent users default to MANAGER for testing CRUD operations
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.MANAGER;

      user = this.userRepo.create({
        googleId: data.googleId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        role,
      });
      user = await this.userRepo.save(user);
    } else {
      // update avatar or name if changed
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
        user = await this.userRepo.save(user);
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
      user: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  /**
   * Dev/Reviewer fallback login when Google Cloud Console keys are not configured
   */
  async devDemoLogin(email?: string): Promise<AuthResponseDto> {
    let user: UserEntity | null = null;
    if (email) {
      user = await this.userRepo.findOne({ where: { email } });
    }
    if (!user) {
      user = await this.userRepo.findOne({ order: { createdAt: 'ASC' } });
    }
    if (!user) {
      user = this.userRepo.create({
        googleId: 'demo-google-user-1',
        email: 'alex.khrystorozhdestvensky@gmail.com',
        fullName: 'Христорождественский Александр',
        avatarUrl: '/static/7c9e6679-7425-40de-944b-e07fc1f90ae7.png',
        role: UserRole.ADMIN,
      });
      user = await this.userRepo.save(user);
    }
    return this.generateAuthResponse(user);
  }

  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }
    return user;
  }
}
