import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateReviewDto {
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Product ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Product ID') })
  productId: string;

  @IsInt({ message: VALIDATION_MESSAGES.MUST_BE_INTEGER('Rating') })
  @Min(1, { message: VALIDATION_MESSAGES.RATING_MIN })
  @Max(5, { message: VALIDATION_MESSAGES.RATING_MAX })
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: VALIDATION_MESSAGES.MAX_LENGTH('Title', 200) })
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: VALIDATION_MESSAGES.MAX_LENGTH('Comment', 2000) })
  comment?: string;

  @IsArray({ message: VALIDATION_MESSAGES.MUST_BE_ARRAY('Images') })
  @IsUrl(
    {},
    { each: true, message: VALIDATION_MESSAGES.INVALID_URL('Each image') },
  )
  @IsOptional()
  images?: string[];
}
