export const JWT_CONSTANTS = {
  SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
  EXPIRATION_TIME: process.env.JWT_EXPIRES_IN || '24h',
  IGNORE_EXPIRATION: false,
} as const;
