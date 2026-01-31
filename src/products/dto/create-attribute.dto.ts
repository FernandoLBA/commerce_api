import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export enum AttributeType {
  SELECT = 'select',
  COLOR = 'color',
}

export class CreateAttributeDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Name') })
  @IsString()
  @MaxLength(50, { message: VALIDATION_MESSAGES.MAX_LENGTH('Name', 50) })
  name: string;

  @IsEnum(AttributeType, {
    message: VALIDATION_MESSAGES.INVALID_ENUM('Type', 'select, color'),
  })
  type: AttributeType;
}
