import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard as NestThrottlerGuard,
  ThrottlerException,
} from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends NestThrottlerGuard {
  /**
   * Override to customize the key used for tracking requests
   * Uses IP address and optionally user ID for authenticated requests
   */
  protected getTracker(req: Record<string, any>): Promise<string> {
    // Get IP from various headers (for proxied requests)
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      'unknown';

    // If user is authenticated, include user ID in the key
    const userId = req.user?.id || 'anonymous';

    return Promise.resolve(`${ip}-${userId}`);
  }

  /**
   * Override to customize error response
   */
  protected throwThrottlingException(context: ExecutionContext): Promise<void> {
    void context;
    return Promise.reject(
      new ThrottlerException(
        'Too many requests. Please wait before making another request.',
      ),
    );
  }

  /**
   * Skip throttling for certain conditions
   */
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Skip throttling for health checks
    if (request.url === '/api/health' || request.url === '/health') {
      return Promise.resolve(true);
    }

    // Skip for internal service calls (if using internal API key)
    const internalKey = request.headers['x-internal-api-key'];
    if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }
}
