import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class SecurityTestDto {
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  input: string;
}

export class PasswordTestDto {
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  password: string;
}

export class BruteForceTestDto {
  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Requests') })
  @IsOptional()
  @Min(1, { message: VALIDATION_MESSAGES.MIN_VALUE('Requests', 1) })
  @Max(100, { message: VALIDATION_MESSAGES.MAX_VALUE('Requests', 100) })
  requests?: number;
}
