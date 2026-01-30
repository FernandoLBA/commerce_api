import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  adminResponse?: string;
}
