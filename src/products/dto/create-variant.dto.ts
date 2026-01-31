import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateVariantDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Product ID') })
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Product ID') })
  productId: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('SKU') })
  @IsString()
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('SKU', 100) })
  sku: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Price') })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Price') },
  )
  @Min(0, { message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Price') })
  price: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Compare at price') },
  )
  @Min(0, {
    message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Compare at price'),
  })
  compareAtPrice?: number;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Stock') })
  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Stock') })
  @Min(0, { message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Stock') })
  stock: number;

  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('isActive') })
  isActive?: boolean;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Attribute value IDs') })
  @IsArray({
    message: VALIDATION_MESSAGES.MUST_BE_ARRAY('Attribute value IDs'),
  })
  @ArrayMinSize(1, {
    message: VALIDATION_MESSAGES.ARRAY_MIN_SIZE('Attribute value IDs', 1),
  })
  @IsUUID('4', {
    each: true,
    message: VALIDATION_MESSAGES.INVALID_UUID('Each attribute value ID'),
  })
  attributeValueIds: string[];
}
