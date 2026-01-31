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
  IsNotEmpty,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @MaxLength(200, { message: VALIDATION_MESSAGES.MAX_LENGTH('Name', 200) })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('Slug', 100) })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: VALIDATION_MESSAGES.SLUG_FORMAT,
  })
  slug?: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @MaxLength(2000, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Description', 2000),
  })
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Short description', 500),
  })
  shortDescription?: string;

  @IsNumber()
  @IsPositive({ message: VALIDATION_MESSAGES.POSITIVE_NUMBER('Price') })
  price: number;

  @IsOptional()
  @IsNumber()
  @IsPositive({
    message: VALIDATION_MESSAGES.POSITIVE_NUMBER('Compare at price'),
  })
  compareAtPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Stock') })
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @IsOptional()
  @IsUUID('4', {
    message: VALIDATION_MESSAGES.FIELD_FORMAT_INVALID('Category ID'),
  })
  categoryId?: string;
}
