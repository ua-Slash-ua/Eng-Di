import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;
}
