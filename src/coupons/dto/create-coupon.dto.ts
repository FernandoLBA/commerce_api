import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDate,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../../generated/prisma/client';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Code') })
  @MaxLength(50, { message: VALIDATION_MESSAGES.MAX_LENGTH('Code', 50) })
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Description', 500),
  })
  description?: string;

  @IsEnum(DiscountType, {
    message: VALIDATION_MESSAGES.INVALID_ENUM(
      'Discount type',
      'PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING',
    ),
  })
  discountType: DiscountType;

  @IsNumber(
    {},
    { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Discount value') },
  )
  @Min(0, {
    message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Discount value'),
  })
  discountValue: number;

  @IsNumber(
    {},
    { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Min purchase amount') },
  )
  @Min(0, {
    message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Min purchase amount'),
  })
  @IsOptional()
  minPurchaseAmount?: number;

  @IsNumber(
    {},
    { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Max discount amount') },
  )
  @Min(0, {
    message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Max discount amount'),
  })
  @IsOptional()
  maxDiscountAmount?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Usage limit') })
  @Min(1, { message: VALIDATION_MESSAGES.MIN_VALUE('Usage limit', 1) })
  @IsOptional()
  usageLimit?: number;

  @IsNumber(
    {},
    { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Usage limit per user') },
  )
  @Min(1, { message: VALIDATION_MESSAGES.MIN_VALUE('Usage limit per user', 1) })
  @IsOptional()
  usageLimitPerUser?: number;

  @Type(() => Date)
  @IsDate({ message: VALIDATION_MESSAGES.INVALID_DATE('Start date') })
  startDate: Date;

  @Type(() => Date)
  @IsDate({ message: VALIDATION_MESSAGES.INVALID_DATE('End date') })
  endDate: Date;

  @IsBoolean({ message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('isActive') })
  @IsOptional()
  isActive?: boolean;

  @IsArray({
    message: VALIDATION_MESSAGES.MUST_BE_ARRAY('Applicable categories'),
  })
  @IsUUID('4', {
    each: true,
    message: VALIDATION_MESSAGES.INVALID_UUID('Each category ID'),
  })
  @IsOptional()
  applicableCategories?: string[];

  @IsArray({
    message: VALIDATION_MESSAGES.MUST_BE_ARRAY('Applicable products'),
  })
  @IsUUID('4', {
    each: true,
    message: VALIDATION_MESSAGES.INVALID_UUID('Each product ID'),
  })
  @IsOptional()
  applicableProducts?: string[];

  @IsArray({ message: VALIDATION_MESSAGES.MUST_BE_ARRAY('Excluded products') })
  @IsUUID('4', {
    each: true,
    message: VALIDATION_MESSAGES.INVALID_UUID('Each product ID'),
  })
  @IsOptional()
  excludedProducts?: string[];

  @IsBoolean({
    message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('isFirstPurchaseOnly'),
  })
  @IsOptional()
  isFirstPurchaseOnly?: boolean;
}
