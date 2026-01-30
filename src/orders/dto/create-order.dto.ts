import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Shipping address ID is required' })
  @IsUUID('4', { message: 'Shipping address ID must be a valid UUID' })
  shippingAddressId: string;

  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(PaymentMethod, { message: 'Payment method must be stripe or mercadopago' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must be at most 500 characters' })
  notes?: string;

  @IsOptional()
  @IsString({ message: 'Discount code must be a string' })
  @MaxLength(50, { message: 'Discount code must be at most 50 characters' })
  discountCode?: string;
}
