import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class AddToWishlistDto {
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Product ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Product ID') })
  productId: string;

  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Variant ID') })
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH('Notes', 500) })
  notes?: string;

  @IsBoolean({
    message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('Notify on price drop'),
  })
  @IsOptional()
  notifyOnPriceDrop?: boolean;

  @IsBoolean({
    message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('Notify on back in stock'),
  })
  @IsOptional()
  notifyOnBackInStock?: boolean;
}
