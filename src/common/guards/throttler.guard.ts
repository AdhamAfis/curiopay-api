import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends NestThrottlerGuard {
  // Override the getTracker method to customize how we track rate limits
  protected getTracker(context: ExecutionContext): Promise<string> {
    // Get the request object
    const request = context.switchToHttp().getRequest();

    // Use X-Forwarded-For header if available (for when behind a proxy/load balancer)
    // Otherwise fall back to the client's IP address
    const ip = request.headers['x-forwarded-for'] || request.ip;

    // Return a unique identifier for this client
    // You can customize this to include other factors like user ID if authenticated
    return Promise.resolve(ip);
  }
}
