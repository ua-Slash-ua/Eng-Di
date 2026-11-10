import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const USER_ROLES = ['student', 'teacher'] as const;

export class CreateUserDto {
  @IsEmail()
  @MaxLength(191)
  email!: string;

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
  middleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  birthDate?: string | null;

  @IsOptional()
  @IsIn([...USER_ROLES, ''])
  userRole?: (typeof USER_ROLES)[number] | '';

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @IsOptional()
  @IsInt()
  adminRoleId?: number;
}
