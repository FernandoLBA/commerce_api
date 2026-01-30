import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
