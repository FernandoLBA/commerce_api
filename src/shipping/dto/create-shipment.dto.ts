import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsObject,
  Min,
  IsDateString,
} from 'class-validator';
import { ShippingCarrier } from '../enums/shipping-carrier.enum';

export class CreateShipmentDto {
  @IsNotEmpty({ message: 'Order ID is required' })
  @IsString()
  orderId: string;

  @IsNotEmpty({ message: 'Carrier is required' })
  @IsEnum(ShippingCarrier, { message: 'Invalid shipping carrier' })
  carrier: ShippingCarrier;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0, { message: 'Weight must be positive' })
  weightKg?: number;

  @IsOptional()
  @IsObject()
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };

  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  estimatedDeliveryDate?: string;
}
