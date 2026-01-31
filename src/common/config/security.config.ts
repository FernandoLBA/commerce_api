/**
 * Security Configuration
 * Configuración centralizada de seguridad para la API
 */

export const securityConfig = {
  // Helmet - Protección de headers HTTP
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

  // CORS - Configuración de orígenes permitidos
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
    maxAge: 86400, // 24 horas
  },

  // Rate Limiting - Prevención de ataques de fuerza bruta
  throttle: {
    // Configuración global
    global: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60000'), // 60 segundos
      limit: parseInt(process.env.THROTTLE_LIMIT || '100'), // 100 requests por minuto
    },
    // Configuración estricta para autenticación
    auth: {
      ttl: parseInt(process.env.THROTTLE_AUTH_TTL || '60000'), // 60 segundos
      limit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5'), // 5 intentos por minuto
    },
    // Configuración para endpoints de creación
    create: {
      ttl: parseInt(process.env.THROTTLE_CREATE_TTL || '60000'), // 60 segundos
      limit: parseInt(process.env.THROTTLE_CREATE_LIMIT || '30'), // 30 creaciones por minuto
    },
  },

  // Cookies seguras (si se usan)
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
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
