import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  alt?: string;
}