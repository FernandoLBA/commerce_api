import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes, ErrorMessages } from '../constants/error-codes.constants';
import { ApiException } from '../exceptions/api.exception';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: string = ErrorCodes.INTERNAL_SERVER_ERROR;
    let message = ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR];
    let details: Record<string, unknown> | string[] | undefined;

    if (exception instanceof ApiException) {
      statusCode = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;

        // Handle class-validator errors
        if (Array.isArray(responseObj.message)) {
          errorCode = ErrorCodes.VALIDATION_ERROR;
          message = ErrorMessages[ErrorCodes.VALIDATION_ERROR];
          details = responseObj.message as string[];
        }
      }

      // Map common HTTP status codes to error codes
      errorCode = this.mapStatusToErrorCode(statusCode, errorCode);
    } else if (exception instanceof Error) {
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }

      // Log unexpected errors in production
      console.error('Unexpected error:', exception);
    }

    const errorResponse: ApiErrorResponse = {
      statusCode,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  private mapStatusToErrorCode(
    statusCode: number,
    currentCode: string,
  ): string {
    // Only map if we don't already have a specific error code
    if (currentCode !== ErrorCodes.INTERNAL_SERVER_ERROR) {
      return currentCode;
    }

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      default:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
