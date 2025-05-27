export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  emailVerified?: Date | null;
  lastLoginAt?: Date | null;
  provider?: string | null;
  providerAccountId?: string | null;
  [key: string]: any; // Allow for additional properties
}
