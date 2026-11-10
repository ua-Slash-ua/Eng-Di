import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PageSeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  keywords?: string;
}

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^(\/|[a-z0-9-]+)$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PageSeoDto)
  seo?: PageSeoDto;
}
