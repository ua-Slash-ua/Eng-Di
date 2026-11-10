import { PartialType } from '@nestjs/mapped-types';
import { CreateContentLevelDto } from './create-content-level.dto';

export class UpdateContentLevelDto extends PartialType(CreateContentLevelDto) {}
