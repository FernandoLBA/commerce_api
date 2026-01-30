import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SecurityTestDto {
  @IsString()
  @IsNotEmpty()
  input: string;
}

export class PasswordTestDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class BruteForceTestDto {
  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  requests?: number;
}
