import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateAttributeValueDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsUUID('4', { message: VALIDATION_MESSAGES.INVALID_UUID('Attribute ID') })
  attributeId: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED })
  @IsString()
  @MaxLength(50, { message: VALIDATION_MESSAGES.MAX_LENGTH('Value', 50) })
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Display value', 50),
  })
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: VALIDATION_MESSAGES.INVALID_HEX_COLOR,
  })
  displayValue?: string;
}
