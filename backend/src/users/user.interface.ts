
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
  BANNED = 'banned',
}

export interface User {
  id: string; // Google ID
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  createdAt: string; // ISO string
  lastLoginAt: string; // ISO string
}
