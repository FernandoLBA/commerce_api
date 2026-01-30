import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  notifyOnPriceDrop?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOnBackInStock?: boolean;
}
