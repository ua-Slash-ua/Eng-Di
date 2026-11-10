import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { ContentEntityType, TeacherAccessMode } from '@prisma/client';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import type { AuthUser } from '../users/user.types';
import { CurriculumService } from './curriculum.service';
import { LessonPresentationsService } from './lesson-presentations.service';
import { CreateContentLevelDto } from './dto/create-content-level.dto';
import { UpdateContentLevelDto } from './dto/update-content-level.dto';
import { CreateContentCourseDto } from './dto/create-content-course.dto';
import { UpdateContentCourseDto } from './dto/update-content-course.dto';
import { CreateContentUnitDto } from './dto/create-content-unit.dto';
import { UpdateContentUnitDto } from './dto/update-content-unit.dto';
import { CreateContentLessonDto } from './dto/create-content-lesson.dto';
import { UpdateContentLessonDto } from './dto/update-content-lesson.dto';
import { GrantAccessDto } from './dto/grant-access.dto';

@Controller('admin/curriculum')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminCurriculumController {
  constructor(
    private readonly curriculum: CurriculumService,
    private readonly presentations: LessonPresentationsService,
  ) {}

  // ── Levels ───────────────────────────────────────────────────────────────

  @Get('levels')
  @Permissions('curriculum.read')
  listLevels() {
    return this.curriculum.listLevels();
  }

  @Post('levels')
  @Permissions('curriculum.write')
  createLevel(@Body() dto: CreateContentLevelDto) {
    return this.curriculum.createLevel(dto);
  }

  @Get('levels/:id')
  @Permissions('curriculum.read')
  getLevel(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.findLevel(id);
  }

  @Patch('levels/:id')
  @Permissions('curriculum.write')
  updateLevel(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentLevelDto) {
    return this.curriculum.updateLevel(id, dto);
  }

  @Delete('levels/:id')
  @Permissions('curriculum.delete')
  deleteLevel(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.removeLevel(id);
  }

  // ── Courses ──────────────────────────────────────────────────────────────

  @Get('courses')
  @Permissions('curriculum.read')
  listCourses(@Query('levelId') levelId?: string) {
    return this.curriculum.listCourses(levelId ? Number(levelId) : undefined);
  }

  @Post('courses')
  @Permissions('curriculum.write')
  createCourse(@Body() dto: CreateContentCourseDto) {
    return this.curriculum.createCourse(dto);
  }

  @Get('courses/:id')
  @Permissions('curriculum.read')
  getCourse(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.findCourse(id);
  }

  @Patch('courses/:id')
  @Permissions('curriculum.write')
  updateCourse(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentCourseDto) {
    return this.curriculum.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @Permissions('curriculum.delete')
  deleteCourse(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.removeCourse(id);
  }

  // ── Units ────────────────────────────────────────────────────────────────

  @Get('units')
  @Permissions('curriculum.read')
  listUnits(@Query('courseId') courseId?: string) {
    return this.curriculum.listUnits(courseId !== undefined ? Number(courseId) : undefined);
  }

  @Post('units')
  @Permissions('curriculum.write')
  createUnit(@Body() dto: CreateContentUnitDto) {
    return this.curriculum.createUnit(dto);
  }

  @Get('units/:id')
  @Permissions('curriculum.read')
  getUnit(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.findUnit(id);
  }

  @Patch('units/:id')
  @Permissions('curriculum.write')
  updateUnit(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentUnitDto) {
    return this.curriculum.updateUnit(id, dto);
  }

  @Delete('units/:id')
  @Permissions('curriculum.delete')
  deleteUnit(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.removeUnit(id);
  }

  // ── Content Lessons ───────────────────────────────────────────────────────

  @Get('lessons')
  @Permissions('curriculum.read')
  listLessons(@Query('unitId') unitId?: string) {
    return this.curriculum.listContentLessons(unitId !== undefined ? Number(unitId) : undefined);
  }

  @Post('lessons')
  @Permissions('curriculum.write')
  createLesson(@Body() dto: CreateContentLessonDto) {
    return this.curriculum.createContentLesson(dto);
  }

  @Get('lessons/:id')
  @Permissions('curriculum.read')
  getLesson(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.findContentLesson(id);
  }

  @Patch('lessons/:id')
  @Permissions('curriculum.write')
  updateLesson(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentLessonDto) {
    return this.curriculum.updateContentLesson(id, dto);
  }

  @Delete('lessons/:id')
  @Permissions('curriculum.delete')
  deleteLesson(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.removeContentLesson(id);
  }

  @Post('lessons/:id/presentation')
  @Permissions('curriculum.write')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 512 * 1024 * 1024 },
    }),
  )
  uploadLessonPresentation(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.presentations.uploadForContentLesson(id, file);
  }

  @Delete('lessons/:id/presentation')
  @Permissions('curriculum.write')
  removeLessonPresentation(@Param('id', ParseIntPipe) id: number) {
    return this.presentations.removeForContentLesson(id);
  }

  // ── Teacher access ────────────────────────────────────────────────────────

  @Get('accesses')
  @Permissions('curriculum.read')
  listAccesses(@Query('teacherId') teacherId?: string) {
    return this.curriculum.listAccesses(teacherId ? Number(teacherId) : undefined);
  }

  @Post('accesses')
  @Permissions('curriculum.write')
  grantAccess(@Body() dto: GrantAccessDto, @Req() req: Request & { user: AuthUser }) {
    return this.curriculum.grantAccess(req.user.id, {
      teacherId: dto.teacherId,
      entityType: dto.entityType as ContentEntityType,
      entityId: dto.entityId,
      mode: dto.mode as TeacherAccessMode,
    });
  }

  @Delete('accesses/:id')
  @Permissions('curriculum.write')
  revokeAccess(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.revokeAccess(id);
  }
}
