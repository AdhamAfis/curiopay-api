export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLE_HIERARCHY = {
  [UserRole.SUPER_ADMIN]: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.USER],
  [UserRole.USER]: [UserRole.USER],
};
