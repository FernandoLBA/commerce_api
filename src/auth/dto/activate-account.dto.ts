import { IsString, IsNotEmpty } from 'class-validator';

export class ActivateAccountDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
