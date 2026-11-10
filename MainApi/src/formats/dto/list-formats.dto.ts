import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListFormatsDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  icon?: string;

  /** Comma separated accent numbers. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  accent?: string;
}
