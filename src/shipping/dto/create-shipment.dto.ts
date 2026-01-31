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
import { ShippingCarrier } from '../../generated/prisma/client';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateShipmentDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsString()
  orderId: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsEnum(ShippingCarrier, { message: VALIDATION_MESSAGES.INVALID_ENUM('Carrier', 'OLVA, SHALOM, CRUZ_DEL_SUR, SERVIENTREGA, PICKUP') })
  carrier: ShippingCarrier;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Weight') })
  @Min(0, { message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Weight') })
  weightKg?: number;

  @IsOptional()
  @IsObject()
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };

  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.INVALID_DATE('Estimated delivery date') })
  estimatedDeliveryDate?: string;
}
