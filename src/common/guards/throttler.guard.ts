import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard as NestThrottlerGuard,
  ThrottlerRequest,
} from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends NestThrottlerGuard {
  // Override the getTracker method to customize how we track rate limits
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use X-Forwarded-For header if available (for when behind a proxy/load balancer)
    // Otherwise fall back to the client's IP address
    const ip =
      req.headers?.['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress;

    // Return a unique identifier for this client
    // You can customize this to include other factors like user ID if authenticated
    return ip || 'unknown';
  }

  // Override generateKey to ensure proper context handling
  protected generateKey(
    context: ExecutionContext,
    tracker: string,
    suffix: string,
  ): string {
    const prefix = `${context.getClass().name}-${context.getHandler().name}`;
    return `${prefix}-${tracker}-${suffix}`;
  }
}
