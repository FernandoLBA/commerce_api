import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductImageDto {
  @IsNotEmpty({ message: 'URL is required' })
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @IsOptional()
  @IsString({ message: 'Alt text must be a string' })
  @MaxLength(255, { message: 'Alt text must be at most 255 characters' })
  alt?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Width must be a number' })
  @Min(0, { message: 'Width must be at least 0' })
  width?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Height must be a number' })
  @Min(0, { message: 'Height must be at least 0' })
  height?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Display order must be a number' })
  @Min(0, { message: 'Display order must be at least 0' })
  displayOrder?: number;
}
