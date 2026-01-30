import { IsNumber, Min, Max } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(99, { message: 'Quantity must be at most 99' })
  quantity: number;
}
