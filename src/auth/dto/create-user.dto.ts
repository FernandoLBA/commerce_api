import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateUserDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.INVALID_EMAIL })
  email!: string;

  @IsString()
  @MinLength(8, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH })
  @MaxLength(50, { message: VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('First name', 100),
  })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('Last name', 100) })
  lastName?: string;
}
