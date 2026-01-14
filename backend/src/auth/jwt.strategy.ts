import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const resolvedRole: UserRole = (() => {
      if (user?.email && adminEmails.includes(user.email)) return UserRole.ADMIN;
      return (user?.role || payload.role || UserRole.GUEST) as UserRole;
    })();

    if (resolvedRole === UserRole.BANNED) {
      throw new ForbiddenException('BANNED_USER');
    }

    if (user) {
      return {
        userId: user.id,
        email: user.email,
        role: resolvedRole,
        name: user.name,
        picture: user.picture,
      };
    }

    return { userId: payload.sub, email: payload.email, role: resolvedRole };
  }
}
