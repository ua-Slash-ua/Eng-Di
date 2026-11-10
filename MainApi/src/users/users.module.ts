import { Module } from '@nestjs/common';
import { TeacherStudentsService } from './teacher-students.service';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, TeacherStudentsService],
  exports: [UsersService, TeacherStudentsService],
})
export class UsersModule {}
