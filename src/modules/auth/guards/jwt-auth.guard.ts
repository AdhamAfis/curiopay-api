import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Skipping auth for public endpoint');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    this.logger.debug(
      `Authenticating request to ${request.method} ${request.url}`,
    );

    const authHeader = request.headers.authorization;
    const hasToken = authHeader?.startsWith('Bearer ');
    if (!hasToken) {
      this.logger.warn('No Bearer token found in request');
      throw new UnauthorizedException('Missing authentication token');
    }

    // Check if token is blacklisted
    try {
      const token = authHeader.split(' ')[1];
      const isBlacklisted = await this.cacheManager.get(
        `blacklisted_token:${token}`,
      );

      if (isBlacklisted) {
        this.logger.warn('Attempt to use blacklisted token');
        throw new UnauthorizedException('Token has been revoked');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Continue with regular token validation if there's an error checking the blacklist
    }

    try {
      const result = await super.canActivate(context);
      if (result) {
        this.logger.debug('Authentication successful');
      }
      return result as boolean;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw error;
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error(
        'Authentication error:',
        err?.message || 'User not found',
      );
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
