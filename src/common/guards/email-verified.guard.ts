import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.userId || user.id },
    });

    if (!userRecord) {
      throw new UnauthorizedException('User not found');
    }

    if (!userRecord.emailVerified) {
      throw new UnauthorizedException(
        'Email verification required. Please verify your email address before performing this action.',
      );
    }

    return true;
  }
} 