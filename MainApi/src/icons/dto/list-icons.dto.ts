import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListIconsDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  type?: string;

  /** Comma separated group ids. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  groupId?: string;
}
