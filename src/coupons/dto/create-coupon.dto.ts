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
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../enums/discount-type.enum';

export class CreateCouponDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPurchaseAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscountAmount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimitPerUser?: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  applicableCategories?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  applicableProducts?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  excludedProducts?: string[];

  @IsBoolean()
  @IsOptional()
  isFirstPurchaseOnly?: boolean;
}
