import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class AddToCartDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Product ID') })
  productId: string;

  @IsOptional()
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Variant ID') })
  variantId?: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Quantity') })
  @Min(1, { message: VALIDATION_MESSAGES.QUANTITY_MIN })
  @Max(99, { message: VALIDATION_MESSAGES.QUANTITY_MAX })
  quantity: number;
}
