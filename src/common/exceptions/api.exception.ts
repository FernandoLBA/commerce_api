import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ErrorCode,
  ErrorCodes,
  ErrorMessages,
} from '../constants/error-codes.constants';

export class ApiException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: Record<string, unknown> | string[];

  constructor(
    errorCode: ErrorCode,
    statusCode: HttpStatus,
    message?: string,
    details?: Record<string, unknown> | string[],
  ) {
    super(message || ErrorMessages[errorCode], statusCode);
    this.errorCode = errorCode;
    this.details = details;
  }
}

// Authentication exceptions
export class UserAlreadyExistsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.AUTH_USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.AUTH_USER_ALREADY_EXISTS],
    );
  }
}

export class UserNotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.AUTH_USER_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.AUTH_USER_NOT_FOUND],
    );
  }
}

export class InvalidCredentialsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
      HttpStatus.UNAUTHORIZED,
      message || ErrorMessages[ErrorCodes.AUTH_INVALID_CREDENTIALS],
    );
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.AUTH_UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      message || ErrorMessages[ErrorCodes.AUTH_UNAUTHORIZED],
    );
  }
}

// Activation exceptions
export class ActivationTokenInvalidException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.AUTH_ACTIVATION_TOKEN_INVALID,
      HttpStatus.BAD_REQUEST,
      message || ErrorMessages[ErrorCodes.AUTH_ACTIVATION_TOKEN_INVALID],
    );
  }
}

export class ActivationTokenExpiredException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.AUTH_ACTIVATION_TOKEN_EXPIRED,
      HttpStatus.BAD_REQUEST,
      message || ErrorMessages[ErrorCodes.AUTH_ACTIVATION_TOKEN_EXPIRED],
    );
  }
}

export class AccountAlreadyActiveException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.AUTH_ACCOUNT_ALREADY_ACTIVE,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.AUTH_ACCOUNT_ALREADY_ACTIVE],
    );
  }
}

// Validation exceptions
export class ValidationException extends ApiException {
  constructor(details: string | string[]) {
    const detailsArray = Array.isArray(details) ? details : [details];
    super(
      ErrorCodes.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      Array.isArray(details)
        ? ErrorMessages[ErrorCodes.VALIDATION_ERROR]
        : details,
      detailsArray,
    );
  }
}

// Product exceptions
export class ProductNotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.PRODUCT_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.PRODUCT_NOT_FOUND],
    );
  }
}

export class ProductAlreadyExistsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.PRODUCT_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.PRODUCT_ALREADY_EXISTS],
    );
  }
}

// Category exceptions
export class CategoryNotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.CATEGORY_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.CATEGORY_NOT_FOUND],
    );
  }
}

export class CategoryAlreadyExistsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.CATEGORY_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.CATEGORY_ALREADY_EXISTS],
    );
  }
}

export class CategoryHasProductsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.CATEGORY_HAS_PRODUCTS,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.CATEGORY_HAS_PRODUCTS],
    );
  }
}

// General exceptions
export class NotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.NOT_FOUND],
    );
  }
}

export class BadRequestException extends ApiException {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      ErrorCodes.BAD_REQUEST,
      HttpStatus.BAD_REQUEST,
      message || ErrorMessages[ErrorCodes.BAD_REQUEST],
      details,
    );
  }
}

export class ForbiddenException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      message || ErrorMessages[ErrorCodes.FORBIDDEN],
    );
  }
}

// Address exceptions
export class AddressNotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.ADDRESS_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.ADDRESS_NOT_FOUND],
    );
  }
}

// Product variant exceptions
export class ProductVariantNotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.PRODUCT_VARIANT_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.PRODUCT_VARIANT_NOT_FOUND],
    );
  }
}

export class ProductSkuExistsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.PRODUCT_SKU_EXISTS,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.PRODUCT_SKU_EXISTS],
    );
  }
}

export class ProductSlugExistsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.PRODUCT_SLUG_EXISTS,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.PRODUCT_SLUG_EXISTS],
    );
  }
}

export class ProductImageNotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.PRODUCT_IMAGE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.PRODUCT_IMAGE_NOT_FOUND],
    );
  }
}

// Attribute exceptions
export class AttributeNotFoundException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.ATTRIBUTE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message || ErrorMessages[ErrorCodes.ATTRIBUTE_NOT_FOUND],
    );
  }
}

export class AttributeAlreadyExistsException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.ATTRIBUTE_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      message || ErrorMessages[ErrorCodes.ATTRIBUTE_ALREADY_EXISTS],
    );
  }
}

export class FileUploadException extends ApiException {
  constructor(message?: string) {
    super(
      ErrorCodes.FILE_UPLOAD_ERROR,
      HttpStatus.BAD_REQUEST,
      message || ErrorMessages[ErrorCodes.FILE_UPLOAD_ERROR],
    );
  }
}
