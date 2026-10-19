import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback',
      scope: ['profile', 'email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value || `${profile.id}@google.com`;
    const fullName = profile.displayName || profile.name?.givenName || 'Google User';
    const avatarUrl = profile.photos?.[0]?.value || '/static/7c9e6679-7425-40de-944b-e07fc1f90ae7.png';

    const user = await this.authService.validateOrCreateGoogleUser({
      googleId: profile.id,
      email,
      fullName,
      avatarUrl,
    });

    return user;
  }
}
