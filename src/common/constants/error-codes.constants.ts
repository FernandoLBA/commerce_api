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

  // Product errors (PROD_XXX)
  PRODUCT_NOT_FOUND: 'PROD_001',
  PRODUCT_ALREADY_EXISTS: 'PROD_002',
  PRODUCT_SLUG_EXISTS: 'PROD_003',
  PRODUCT_VARIANT_NOT_FOUND: 'PROD_004',
  PRODUCT_SKU_EXISTS: 'PROD_005',
  PRODUCT_IMAGE_NOT_FOUND: 'PROD_006',

  // Category errors (CAT_XXX)
  CATEGORY_NOT_FOUND: 'CAT_001',
  CATEGORY_ALREADY_EXISTS: 'CAT_002',
  CATEGORY_HAS_PRODUCTS: 'CAT_003',

  // User errors (USER_XXX)
  USER_NOT_FOUND: 'USER_001',
  USER_INACTIVE: 'USER_002',

  // Address errors (ADDR_XXX)
  ADDRESS_NOT_FOUND: 'ADDR_001',

  // Attribute errors (ATTR_XXX)
  ATTRIBUTE_NOT_FOUND: 'ATTR_001',
  ATTRIBUTE_ALREADY_EXISTS: 'ATTR_002',
  ATTRIBUTE_VALUE_NOT_FOUND: 'ATTR_003',

  // General errors (GEN_XXX)
  INTERNAL_SERVER_ERROR: 'GEN_001',
  NOT_FOUND: 'GEN_002',
  BAD_REQUEST: 'GEN_003',
  FORBIDDEN: 'GEN_004',
  FILE_UPLOAD_ERROR: 'GEN_005',
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
  [ErrorCodes.PRODUCT_NOT_FOUND]: 'Product not found',
  [ErrorCodes.PRODUCT_ALREADY_EXISTS]: 'Product already exists',
  [ErrorCodes.PRODUCT_SLUG_EXISTS]: 'Product slug already exists',
  [ErrorCodes.PRODUCT_VARIANT_NOT_FOUND]: 'Product variant not found',
  [ErrorCodes.PRODUCT_SKU_EXISTS]: 'SKU already exists',
  [ErrorCodes.PRODUCT_IMAGE_NOT_FOUND]: 'Product image not found',
  [ErrorCodes.CATEGORY_NOT_FOUND]: 'Category not found',
  [ErrorCodes.CATEGORY_ALREADY_EXISTS]: 'Category already exists',
  [ErrorCodes.CATEGORY_HAS_PRODUCTS]: 'Category has associated products',
  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.USER_INACTIVE]: 'User account is inactive',
  [ErrorCodes.ADDRESS_NOT_FOUND]: 'Address not found',
  [ErrorCodes.ATTRIBUTE_NOT_FOUND]: 'Attribute not found',
  [ErrorCodes.ATTRIBUTE_ALREADY_EXISTS]: 'Attribute already exists',
  [ErrorCodes.ATTRIBUTE_VALUE_NOT_FOUND]: 'Attribute value not found',
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.BAD_REQUEST]: 'Bad request',
  [ErrorCodes.FORBIDDEN]: 'Access forbidden',
  [ErrorCodes.FILE_UPLOAD_ERROR]: 'File upload failed',
};
