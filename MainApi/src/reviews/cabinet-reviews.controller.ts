import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserPanelGuard } from '../auth/user-panel.guard';
import type { AuthUser } from '../users/user.types';
import { CreateCabinetReviewDto } from './dto/create-cabinet-review.dto';
import { UpdateCabinetReviewDto } from './dto/update-cabinet-review.dto';
import { ReviewsService } from './reviews.service';

function requireStudent(req: Request): AuthUser {
  const user = (req as Request & { user: AuthUser }).user;
  if (user.userRole !== 'student') {
    throw new ForbiddenException('Відгуки доступні лише учням');
  }
  return user;
}

@Controller('cabinet/reviews')
@UseGuards(JwtAuthGuard, UserPanelGuard)
export class CabinetReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('teachers')
  teachers() {
    return this.reviews.listTeachers();
  }

  @Get()
  mine(@Req() req: Request) {
    const user = requireStudent(req);
    return this.reviews.listMine(user.id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateCabinetReviewDto) {
    const user = requireStudent(req);
    return this.reviews.createForUser(user.id, dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCabinetReviewDto) {
    const user = requireStudent(req);
    return this.reviews.updateForUser(user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = requireStudent(req);
    return this.reviews.removeForUser(user.id, id);
  }
}
