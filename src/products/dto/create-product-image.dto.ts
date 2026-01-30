import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductImageDto {
  @IsNotEmpty({ message: 'URL is required' })
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @IsOptional()
  @IsUrl({}, { message: 'Thumbnail URL must be a valid URL' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString({ message: 'Public ID must be a string' })
  @MaxLength(255, { message: 'Public ID must be at most 255 characters' })
  publicId?: string;

  @IsOptional()
  @IsString({ message: 'Alt text must be a string' })
  @MaxLength(255, { message: 'Alt text must be at most 255 characters' })
  altText?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Position must be a number' })
  @Min(0, { message: 'Position must be at least 0' })
  position?: number;

  @IsOptional()
  @IsBoolean({ message: 'isPrimary must be a boolean' })
  isPrimary?: boolean;
}
