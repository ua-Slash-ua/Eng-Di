import { PartialType } from '@nestjs/mapped-types';
import { CreateContentLessonDto } from './create-content-lesson.dto';

export class UpdateContentLessonDto extends PartialType(CreateContentLessonDto) {}
