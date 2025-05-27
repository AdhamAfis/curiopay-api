import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Type,
  mixin,
} from '@nestjs/common';
import { Role } from '@prisma/client';

// Factory function to create a guard with specified restricted properties
export function AdminPropertiesGuard(
  restrictedProperties: string[] = ['isDefault', 'isSystem'],
): Type<CanActivate> {
  @Injectable()
  class AdminPropertiesGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const body = request.body;

      // If no body, nothing to check
      if (!body) {
        return true;
      }

      // Check if any restricted properties are being set
      const hasRestrictedProperties = restrictedProperties.some(
        (prop) => body[prop] !== undefined,
      );

      // If no restricted properties being set, always allow
      if (!hasRestrictedProperties) {
        return true;
      }

      // Ensure user exists and has a role
      if (!user || !user.role) {
        throw new ForbiddenException('Access denied');
      }

      // Check if user has admin permissions
      const isAdmin =
        user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

      if (!isAdmin) {
        throw new ForbiddenException(
          `Only administrators can set the following properties: ${restrictedProperties.join(', ')}`,
        );
      }

      return true;
    }
  }

  return mixin(AdminPropertiesGuardMixin);
}
