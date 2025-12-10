import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async googleLogin(req) {
    if (!req.user) {
      throw new Error('No user from google');
    }

    const user = await this.usersService.createOrUpdate(req.user);
    
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }
}
