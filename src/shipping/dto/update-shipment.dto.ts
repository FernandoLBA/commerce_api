import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ShippingStatus } from '../enums/shipping-status.enum';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class UpdateShipmentDto {
  @IsOptional()
  @IsEnum(ShippingStatus, { message: VALIDATION_MESSAGES.INVALID_ENUM('Status', 'pending, processing, shipped, in_transit, out_for_delivery, delivered, failed, returned') })
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
