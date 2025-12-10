import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserRole } from './user.interface';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly dataPath = path.join(process.cwd(), 'data', 'users.json');
  private users: User[] = [];

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.loadUsers();
  }

  private loadUsers() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      try {
        this.users = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse users.json', e);
        this.users = [];
      }
    } else {
      this.users = [];
      this.saveUsers();
    }
  }

  private saveUsers() {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.users, null, 2));
  }

  async findOne(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async createOrUpdate(googleProfile: any): Promise<User> {
    const { id, emails, displayName, photos } = googleProfile;
    const email = emails[0].value;
    const picture = photos[0]?.value;

    let user = await this.findOne(id);
    const now = new Date().toISOString();

    if (user) {
      // Update existing user
      user.name = displayName;
      user.picture = picture;
      user.lastLoginAt = now;
      
      // Check if admin email matches env, force admin role if so
      const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim());
      if (adminEmails.includes(email) && user.role !== UserRole.ADMIN) {
        user.role = UserRole.ADMIN;
      }
    } else {
      // Create new user
      const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim());
      const role = adminEmails.includes(email) ? UserRole.ADMIN : UserRole.GUEST;

      user = {
        id,
        email,
        name: displayName,
        picture,
        role,
        createdAt: now,
        lastLoginAt: now,
      };
      this.users.push(user);
    }

    this.saveUsers();
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async updateRole(id: string, role: UserRole): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) return null;
    
    // Prevent changing admin role if it matches env ADMIN_EMAILS
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim());
    if (adminEmails.includes(user.email) && role !== UserRole.ADMIN) {
        throw new Error('Cannot change role of a fixed admin');
    }

    user.role = role;
    this.saveUsers();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    const user = this.users[index];
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim());
    if (adminEmails.includes(user.email)) {
        throw new Error('Cannot delete a fixed admin');
    }

    this.users.splice(index, 1);
    this.saveUsers();
    return true;
  }
}
