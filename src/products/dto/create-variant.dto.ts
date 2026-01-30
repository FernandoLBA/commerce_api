import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  Min,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateVariantDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsUUID('4', { message: 'Product ID must be a valid UUID' })
  productId: string;

  @IsNotEmpty({ message: 'SKU is required' })
  @IsString({ message: 'SKU must be a string' })
  @MaxLength(100, { message: 'SKU must be at most 100 characters' })
  sku: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a number with at most 2 decimal places' },
  )
  @Min(0, { message: 'Price must be at least 0' })
  price: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Compare at price must be a number with at most 2 decimal places' },
  )
  @Min(0, { message: 'Compare at price must be at least 0' })
  compareAtPrice?: number;

  @IsNotEmpty({ message: 'Stock is required' })
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock must be at least 0' })
  stock: number;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @IsNotEmpty({ message: 'Attribute value IDs are required' })
  @IsArray({ message: 'Attribute value IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one attribute value ID is required' })
  @IsUUID('4', { each: true, message: 'Each attribute value ID must be a valid UUID' })
  attributeValueIds: string[];
}
