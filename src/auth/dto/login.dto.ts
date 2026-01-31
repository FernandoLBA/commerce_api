import { IsEmail, IsString, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class LoginDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.INVALID_EMAIL })
  email: string;

  @IsString()
  @MinLength(1, { message: VALIDATION_MESSAGES.REQUIRED('Password') })
  password: string;
}
