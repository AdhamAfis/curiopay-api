import { SetMetadata } from '@nestjs/common';
import { Throttle as NestThrottle } from '@nestjs/throttler';

/**
 * Apply specific rate limiting to a controller or route handler
 *
 * @param limit - The number of requests allowed within the TTL window
 * @param ttl - Time to live in milliseconds
 * @param name - Optional name of the throttle configuration to use from global config
 */
export const Throttle = (limit: number, ttl: number, name?: string) => {
  const options = name 
    ? { [name]: { limit, ttl } } 
    : { default: { limit, ttl } };
    
  return NestThrottle(options);
};

/**
 * Skip throttling for a specific route
 */
export const SkipThrottle = () => SetMetadata('skipThrottle', true);

/**
 * Apply the 'short' throttle configuration (30 requests per minute)
 */
export const ShortThrottle = () =>
  NestThrottle({
    short: { limit: 30, ttl: 60000 }
  });

/**
 * Apply the 'medium' throttle configuration (100 requests per 15 minutes)
 */
export const MediumThrottle = () =>
  NestThrottle({
    medium: { limit: 100, ttl: 900000 }
  });

/**
 * Apply the 'long' throttle configuration (1000 requests per hour)
 */
export const LongThrottle = () =>
  NestThrottle({
    long: { limit: 1000, ttl: 3600000 }
  });

/**
 * Apply the 'sensitive' throttle configuration (5 requests per 15 minutes)
 * Use this for sensitive operations like password reset, login attempts, etc.
 */
export const SensitiveThrottle = () =>
  NestThrottle({
    sensitive: { limit: 5, ttl: 900000 }
  });
