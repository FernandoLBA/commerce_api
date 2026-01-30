import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  IsArray,
  IsUrl,
} from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];
}
