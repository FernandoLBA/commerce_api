import { MovementType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class AdjustStockDto {
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Product ID') })
  @IsOptional()
  productId?: string;

  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Variant ID') })
  @IsOptional()
  variantId?: string;

  @IsEnum(MovementType, {
    message: VALIDATION_MESSAGES.INVALID_ENUM(
      'Type',
      'PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, RETURN, RESERVATION, RELEASE, TRANSFER_IN, TRANSFER_OUT, DAMAGED, EXPIRED',
    ),
  })
  type!: MovementType;

  @IsInt({ message: VALIDATION_MESSAGES.MUST_BE_INTEGER('Quantity') })
  @Min(1, { message: VALIDATION_MESSAGES.MIN_VALUE('Quantity', 1) })
  quantity!: number;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Unit cost') })
  @IsOptional()
  unitCost?: number;
}
