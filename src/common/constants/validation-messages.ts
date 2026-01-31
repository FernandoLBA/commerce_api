/**
 * Constantes de mensajes de validación para todos los DTOs
 * Uso: import { VALIDATION_MESSAGES } from '@common/constants/validation-messages';
 */
export const VALIDATION_MESSAGES = Object.freeze({
  // General
  REQUIRED: (field: string) => `The ${field} field is required`,
  INVALID_FORMAT: 'Invalid format',

  // String validations
  MAX_LENGTH: (field: string, max: number) =>
    `${field} must not exceed ${max} characters`,
  MIN_LENGTH: (field: string, min: number) =>
    `${field} must be at least ${min} characters`,

  // Number validations
  POSITIVE_NUMBER: (field: string) => `${field} must be a positive number`,
  NON_NEGATIVE_NUMBER: (field: string) => `${field} cannot be negative`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must be at most ${max}`,
  MUST_BE_NUMBER: (field: string) => `${field} must be a number`,
  MUST_BE_INTEGER: (field: string) => `${field} must be an integer`,

  // UUID validations
  INVALID_UUID: (field: string) => `${field} must be a valid UUID`,

  // Email validations
  INVALID_EMAIL: 'Please provide a valid email address',

  // Password validations
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  PASSWORD_MAX_LENGTH: 'Password must not exceed 50 characters',

  // Slug validations
  SLUG_FORMAT: 'Slug must be lowercase with hyphens only',

  // URL validations
  INVALID_URL: (field: string) => `${field} must be a valid URL`,

  // Date validations
  INVALID_DATE: (field: string) => `${field} must be a valid date`,

  // Boolean validations
  MUST_BE_BOOLEAN: (field: string) => `${field} must be a boolean`,

  // Array validations
  MUST_BE_ARRAY: (field: string) => `${field} must be an array`,
  ARRAY_MIN_SIZE: (field: string, min: number) =>
    `${field} must have at least ${min} items`,

  // Enum validations
  INVALID_ENUM: (field: string, values: string) =>
    `${field} must be one of: ${values}`,

  // Field-specific format
  FIELD_FORMAT_INVALID: (field: string) => `${field} format is invalid`,

  // Color validations
  INVALID_HEX_COLOR: 'Must be a valid hex color code (e.g., #FF5733)',

  // Quantity validations
  QUANTITY_MIN: 'Quantity must be at least 1',
  QUANTITY_MAX: 'Quantity must be at most 99',

  // Rating validations
  RATING_MIN: 'Rating must be at least 1',
  RATING_MAX: 'Rating cannot exceed 5',
});
