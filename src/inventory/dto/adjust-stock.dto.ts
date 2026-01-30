import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MovementType } from '../enums/movement-type.enum';

export class AdjustStockDto {
  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsEnum(MovementType)
  type: MovementType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  unitCost?: number;
}
