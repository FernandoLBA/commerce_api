export const ErrorCodes = {
  // Authentication errors (AUTH_XXX)
  AUTH_USER_ALREADY_EXISTS: 'AUTH_001',
  AUTH_USER_NOT_FOUND: 'AUTH_002',
  AUTH_INVALID_CREDENTIALS: 'AUTH_003',
  AUTH_INVALID_TOKEN: 'AUTH_004',
  AUTH_TOKEN_EXPIRED: 'AUTH_005',
  AUTH_UNAUTHORIZED: 'AUTH_006',

  // Validation errors (VAL_XXX)
  VALIDATION_ERROR: 'VAL_001',

  // General errors (GEN_XXX)
  INTERNAL_SERVER_ERROR: 'GEN_001',
  NOT_FOUND: 'GEN_002',
  BAD_REQUEST: 'GEN_003',
  FORBIDDEN: 'GEN_004',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.AUTH_USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCodes.AUTH_USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials',
  [ErrorCodes.AUTH_INVALID_TOKEN]: 'Invalid token',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.BAD_REQUEST]: 'Bad request',
  [ErrorCodes.FORBIDDEN]: 'Access forbidden',
};
