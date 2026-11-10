import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  phone!: string;

  @IsOptional()
  @Transform(({ value }) => (value ? value : undefined))
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  location?: string;
}
