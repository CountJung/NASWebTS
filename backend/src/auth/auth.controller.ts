import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    try {
      const { accessToken } = await this.authService.googleLogin(req);
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
    } catch (e: any) {
      if (e?.message === 'BANNED_USER') {
        res.redirect(`${frontendUrl}/login?error=banned`);
        return;
      }
      throw e;
    }
  }
}
