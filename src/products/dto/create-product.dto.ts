import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  MaxLength,
  Min,
  IsPositive,
  Matches,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(200, { message: 'Name must not exceed 200 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Slug must not exceed 100 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase with hyphens only',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Short description must not exceed 500 characters' })
  shortDescription?: string;

  @IsNumber()
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Compare at price must be a positive number' })
  compareAtPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Stock cannot be negative' })
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid category ID format' })
  categoryId?: string;
}
