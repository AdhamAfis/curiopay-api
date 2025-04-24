import { Role } from '@prisma/client';

export type { Role as UserRole };

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [Role.ADMIN, Role.USER],
  [Role.ADMIN]: [Role.USER],
  [Role.USER]: [],
};
