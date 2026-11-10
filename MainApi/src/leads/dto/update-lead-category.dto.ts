import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateLeadCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;
}
