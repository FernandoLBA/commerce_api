import {
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;
}
