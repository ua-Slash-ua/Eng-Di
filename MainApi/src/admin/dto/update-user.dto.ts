import { IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const USER_ROLES = ['student', 'teacher'] as const;

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  middleName?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  phone?: string | null;

  @IsOptional()
  @IsIn([...USER_ROLES, ''])
  @Transform(({ value }) => (value === '' ? null : value))
  userRole?: (typeof USER_ROLES)[number] | null;

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @IsOptional()
  @IsInt()
  adminRoleId?: number | null;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  birthDate?: string | null;
}
