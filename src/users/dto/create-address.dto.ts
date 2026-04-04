import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Label') })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('Label', 100) })
  label!: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Street') })
  @MaxLength(200, { message: VALIDATION_MESSAGES.MAX_LENGTH('Street', 200) })
  street!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: VALIDATION_MESSAGES.MAX_LENGTH('Number', 50) })
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('Apartment', 100) })
  apartment?: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('District') })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('District', 100) })
  district!: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('City') })
  @MaxLength(100, { message: VALIDATION_MESSAGES.MAX_LENGTH('City', 100) })
  city!: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Department') })
  @MaxLength(100, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Department', 100),
  })
  department!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: VALIDATION_MESSAGES.MAX_LENGTH('Postal code', 10) })
  postalCode?: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Recipient name') })
  @MaxLength(100, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Recipient name', 100),
  })
  recipientName!: string;

  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Recipient phone') })
  @MaxLength(20, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Recipient phone', 20),
  })
  recipientPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH('Reference', 500) })
  reference?: string;

  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('isDefault') })
  isDefault?: boolean;
}
