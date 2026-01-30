import {
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('First name', 100) })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('Last name', 100) })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: VALIDATION_MESSAGES.MAX_LENGTH('Phone', 20) })
  phone?: string;
}
