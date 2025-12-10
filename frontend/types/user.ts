export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
  BANNED = 'banned',
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}
