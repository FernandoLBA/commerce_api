import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: VALIDATION_MESSAGES.INVALID_ENUM(
      'Status',
      'PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED',
    ),
  })
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Tracking number', 100),
  })
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Tracking URL', 500),
  })
  trackingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Admin notes', 1000),
  })
  adminNotes?: string;
}
