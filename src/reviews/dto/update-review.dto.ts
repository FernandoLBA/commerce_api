import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateReviewDto } from './create-review.dto';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @IsBoolean({ message: VALIDATION_MESSAGES.MUST_BE_BOOLEAN('isApproved') })
  @IsOptional()
  isApproved?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: VALIDATION_MESSAGES.MAX_LENGTH('Admin response', 1000) })
  adminResponse?: string;
}
