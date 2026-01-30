import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsUUID('4', { message: 'Product ID must be a valid UUID' })
  productId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Variant ID must be a valid UUID' })
  variantId?: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(99, { message: 'Quantity must be at most 99' })
  quantity: number;
}
