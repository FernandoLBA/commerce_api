import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Name') })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('Name', 100) })
  name!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Description', 500),
  })
  description?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('isActive') })
  isActive?: boolean;
}
