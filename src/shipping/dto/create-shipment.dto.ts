import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';
import { ShippingCarrier } from '../../generated/prisma/client';

export class CreateShipmentDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Order ID') })
  @IsString()
  orderId: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Carrier') })
  @IsEnum(ShippingCarrier, {
    message: VALIDATION_MESSAGES.INVALID_ENUM(
      'Carrier',
      'OLVA, SHALOM, CRUZ_DEL_SUR, SERVIENTREGA, PICKUP',
    ),
  })
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
  @IsDateString(
    {},
    { message: VALIDATION_MESSAGES.INVALID_DATE('Estimated delivery date') },
  )
  estimatedDeliveryDate?: string;
}
