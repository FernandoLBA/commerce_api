/**
 * Security Configuration
 * Centralized security configuration for the API
 */

export const securityConfig = {
  // Helmet - HTTP header protection
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  },

  // CORS - Allowed origin configuration
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:4200',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // Rate Limiting - Brute-force attack prevention
  throttle: {
    // Global configuration
    global: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60000'), // 60 seconds
      limit: parseInt(process.env.THROTTLE_LIMIT || '100'), // 100 requests per minute
    },
    // Strict configuration for authentication
    auth: {
      ttl: parseInt(process.env.THROTTLE_AUTH_TTL || '60000'), // 60 seconds
      limit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5'), // 5 attempts per minute
    },
    // Configuration for creation endpoints
    create: {
      ttl: parseInt(process.env.THROTTLE_CREATE_TTL || '60000'), // 60 seconds
      limit: parseInt(process.env.THROTTLE_CREATE_LIMIT || '30'), // 30 creations per minute
    },
  },

  // Secure cookies (if used)
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Password Policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    saltRounds: 10,
  },
};

export default securityConfig;
