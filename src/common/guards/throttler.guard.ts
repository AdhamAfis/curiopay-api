import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import {
  ThrottlerGuard as NestThrottlerGuard,
  ThrottlerRequest,
} from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends NestThrottlerGuard {
  private readonly logger = new Logger(ThrottlerGuard.name);

  // Override the getTracker method to customize how we track rate limits
  protected async getTracker(context: ExecutionContext): Promise<string> {
    try {
      // Validate that context has the switchToHttp method
      if (!context || typeof context.switchToHttp !== 'function') {
        this.logger.warn('Invalid execution context received in getTracker');
        return 'unknown';
      }

      // Extract the request object from the context
      const req = context.switchToHttp().getRequest();

      if (!req) {
        this.logger.warn('No request object found in execution context');
        return 'unknown';
      }

      // Use X-Forwarded-For header if available (for when behind a proxy/load balancer)
      // Otherwise fall back to the client's IP address
      const ip =
        req.headers?.['x-forwarded-for'] ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress;

      // Return a unique identifier for this client
      return ip || 'unknown';
    } catch (error) {
      this.logger.error(`Error in getTracker: ${error.message}`, error.stack);
      return 'unknown';
    }
  }

  // Override generateKey to ensure proper context handling
  protected generateKey(
    context: ExecutionContext,
    tracker: string,
    suffix: string,
  ): string {
    try {
      // Validate context before using it
      if (
        !context ||
        typeof context.getClass !== 'function' ||
        typeof context.getHandler !== 'function'
      ) {
        this.logger.warn('Invalid execution context in generateKey');
        return `unknown-${tracker}-${suffix}`;
      }

      const className = context.getClass()?.name || 'UnknownClass';
      const handlerName = context.getHandler()?.name || 'unknownHandler';
      const prefix = `${className}-${handlerName}`;
      return `${prefix}-${tracker}-${suffix}`;
    } catch (error) {
      this.logger.error(`Error in generateKey: ${error.message}`, error.stack);
      return `unknown-${tracker}-${suffix}`;
    }
  }
}
