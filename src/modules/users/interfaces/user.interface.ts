import { UserRole } from './role.enum';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  isDeleted: boolean;
  emailVerified?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
