import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ShippingStatus } from '../enums/shipping-status.enum';

export class UpdateShipmentDto {
  @IsOptional()
  @IsEnum(ShippingStatus, { message: 'Invalid shipping status' })
  status?: ShippingStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
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
