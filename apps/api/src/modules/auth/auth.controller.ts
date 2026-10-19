import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto } from '@dzencode/contracts';
import { UserEntity } from '../../database/entities';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth redirection
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserEntity;
    const authData = this.authService.generateAuthResponse(user);

    // Redirect to frontend callback page which extracts token into localStorage
    const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendUrl = rawFrontendUrl.replace(/\/+$/, '');
    res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(authData.accessToken)}`);
  }

  @Post('demo-login')
  async demoLogin(@Body('email') email?: string): Promise<AuthResponseDto> {
    return this.authService.devDemoLogin(email);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: Request): Promise<UserEntity> {
    return req.user as UserEntity;
  }
}
