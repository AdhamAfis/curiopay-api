import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user exists and has a role
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user has admin permissions
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (!isAdmin) {
      throw new ForbiddenException(
        'This action requires administrator privileges',
      );
    }

    return true;
  }
}
