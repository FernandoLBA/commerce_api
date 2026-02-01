import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateProductImageDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('URL') })
  @IsUrl({}, { message: VALIDATION_MESSAGES.INVALID_URL('URL') })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH('Alt text', 255) })
  alt?: string;

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Width') })
  @Min(0, { message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Width') })
  width?: number;

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Height') })
  @Min(0, { message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Height') })
  height?: number;

  @IsOptional()
  @IsNumber(
    {},
    { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Display order') },
  )
  @Min(0, { message: VALIDATION_MESSAGES.NON_NEGATIVE_NUMBER('Display order') })
  displayOrder?: number;
}
