import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MaxLength(100, { message: 'Label must not exceed 100 characters' })
  label: string;

  @IsString()
  @MaxLength(200, { message: 'Street must not exceed 200 characters' })
  street: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Number must not exceed 50 characters' })
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Apartment must not exceed 100 characters' })
  apartment?: string;

  @IsString()
  @MaxLength(100, { message: 'District must not exceed 100 characters' })
  district: string;

  @IsString()
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  city: string;

  @IsString()
  @MaxLength(100, { message: 'Department must not exceed 100 characters' })
  department: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Postal code must not exceed 10 characters' })
  postalCode?: string;

  @IsString()
  @MaxLength(100, { message: 'Recipient name must not exceed 100 characters' })
  recipientName: string;

  @IsString()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  recipientPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reference must not exceed 500 characters' })
  reference?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
