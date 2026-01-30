import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('Name', 100) })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH('Description', 500) })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('isActive') })
  isActive?: boolean;
}
