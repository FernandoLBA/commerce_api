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

// Specific exception classes for common use cases
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

export class ValidationException extends ApiException {
  constructor(details: string[]) {
    super(
      ErrorCodes.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      ErrorMessages[ErrorCodes.VALIDATION_ERROR],
      details,
    );
  }
}

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
