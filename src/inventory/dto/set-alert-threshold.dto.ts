import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class SetAlertThresholdDto {
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Product ID') })
  @IsOptional()
  productId?: string;

  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Variant ID') })
  @IsOptional()
  variantId?: string;

  @IsInt({
    message: VALIDATION_MESSAGES.MUST_BE_INTEGER('Low stock threshold'),
  })
  @Min(0, {
    message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Low stock threshold'),
  })
  lowStockThreshold!: number;

  @IsInt({
    message: VALIDATION_MESSAGES.MUST_BE_INTEGER('Critical stock threshold'),
  })
  @Min(0, {
    message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER(
      'Critical stock threshold',
    ),
  })
  @IsOptional()
  criticalStockThreshold?: number;

  @IsBoolean({ message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('alertEnabled') })
  @IsOptional()
  alertEnabled?: boolean;
}
