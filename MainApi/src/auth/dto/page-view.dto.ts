import { IsString, Matches, MaxLength } from 'class-validator';

export class PageViewDto {
  @IsString()
  @MaxLength(180)
  @Matches(/^\//)
  path!: string;
}
