import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class SetAlertThresholdDto {
  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsInt()
  @Min(0)
  lowStockThreshold: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  criticalStockThreshold?: number;

  @IsBoolean()
  @IsOptional()
  alertEnabled?: boolean;
}
