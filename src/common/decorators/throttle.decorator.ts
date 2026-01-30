import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Throttle as NestThrottle, SkipThrottle } from '@nestjs/throttler';

export const THROTTLE_KEY = 'throttle';

/**
 * Throttle types for different scenarios
 */
export enum ThrottleType {
  DEFAULT = 'default',
  AUTH = 'auth',
  CREATE = 'create',
  STRICT = 'strict',
}

/**
 * Custom throttle decorator with predefined configurations
 * @param type - The type of throttling to apply
 */
export const CustomThrottle = (type: ThrottleType = ThrottleType.DEFAULT) => {
  const configs: Record<ThrottleType, { limit: number; ttl: number }> = {
    [ThrottleType.DEFAULT]: { limit: 100, ttl: 60000 },
    [ThrottleType.AUTH]: { limit: 5, ttl: 60000 },
    [ThrottleType.CREATE]: { limit: 30, ttl: 60000 },
    [ThrottleType.STRICT]: { limit: 3, ttl: 60000 },
  };

  const config = configs[type];

  return applyDecorators(
    SetMetadata(THROTTLE_KEY, type),
    NestThrottle({ default: config }),
  );
};

/**
 * Apply strict rate limiting for authentication endpoints
 */
export const AuthThrottle = () => CustomThrottle(ThrottleType.AUTH);

/**
 * Apply moderate rate limiting for creation endpoints
 */
export const CreateThrottle = () => CustomThrottle(ThrottleType.CREATE);

/**
 * Apply strict rate limiting for sensitive operations
 */
export const StrictThrottle = () => CustomThrottle(ThrottleType.STRICT);

/**
 * Skip throttling for specific endpoints
 */
export const NoThrottle = () => SkipThrottle();
