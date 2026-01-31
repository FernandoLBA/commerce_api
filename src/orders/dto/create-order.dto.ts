import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/client';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateOrderDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Shipping address ID') })
  shippingAddressId: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsEnum(PaymentMethod, { message: VALIDATION_MESSAGES.INVALID_ENUM('Payment method', 'STRIPE, MERCADOPAGO, CASH_ON_DELIVERY') })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH('Notes', 500) })
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: VALIDATION_MESSAGES.MAX_LENGTH('Discount code', 50) })
  discountCode?: string;
}
