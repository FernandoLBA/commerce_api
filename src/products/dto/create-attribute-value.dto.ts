import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateAttributeValueDto {
  @IsNotEmpty({ message: 'Attribute ID is required' })
  @IsUUID('4', { message: 'Attribute ID must be a valid UUID' })
  attributeId: string;

  @IsNotEmpty({ message: 'Value is required' })
  @IsString({ message: 'Value must be a string' })
  @MaxLength(50, { message: 'Value must be at most 50 characters' })
  value: string;

  @IsOptional()
  @IsString({ message: 'Display value must be a string' })
  @MaxLength(50, { message: 'Display value must be at most 50 characters' })
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Display value must be a valid hex color code (e.g., #FF5733)',
  })
  displayValue?: string;
}
