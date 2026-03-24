import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ShippingStatus } from '@prisma/client';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class UpdateShipmentDto {
  @IsOptional()
  @IsEnum(ShippingStatus, { message: VALIDATION_MESSAGES.INVALID_ENUM('Status', 'PENDING, PROCESSING, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED, CANCELLED') })
  status?: ShippingStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.INVALID_DATE('Estimated delivery date') })
  estimatedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  deliveryNotes?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  eventDescription?: string;
}
