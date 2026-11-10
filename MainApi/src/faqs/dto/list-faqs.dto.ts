import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ListFaqsDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  question?: string;
}
