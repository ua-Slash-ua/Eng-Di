import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListReviewsDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  author?: string;

  /** Comma separated ratings. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  rating?: string;

  /** Comma separated kinds: manual, user */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  kind?: string;

  /** true, false, or pending (user reviews awaiting moderation) */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  verified?: string;
}
