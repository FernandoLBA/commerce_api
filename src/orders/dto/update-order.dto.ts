import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status?: OrderStatus;

  @IsOptional()
  @IsString({ message: 'Tracking number must be a string' })
  @MaxLength(100, { message: 'Tracking number must be at most 100 characters' })
  trackingNumber?: string;

  @IsOptional()
  @IsString({ message: 'Tracking URL must be a string' })
  @MaxLength(500, { message: 'Tracking URL must be at most 500 characters' })
  trackingUrl?: string;

  @IsOptional()
  @IsString({ message: 'Admin notes must be a string' })
  @MaxLength(1000, { message: 'Admin notes must be at most 1000 characters' })
  adminNotes?: string;
}
