import { IsNotEmpty, IsString, IsEnum, MaxLength } from 'class-validator';

export enum AttributeType {
  SELECT = 'select',
  COLOR = 'color',
}

export class CreateAttributeDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(50, { message: 'Name must be at most 50 characters' })
  name: string;

  @IsEnum(AttributeType, { message: 'Type must be either select or color' })
  type: AttributeType;
}
