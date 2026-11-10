import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  middleName?: string | null;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}
