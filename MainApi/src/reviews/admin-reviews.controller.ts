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
  UseGuards,
} from '@nestjs/common';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { VerifyReviewDto } from './dto/verify-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('reviews')
  @Permissions('reviews.read')
  listReviews(@Query() query: ListReviewsDto) {
    return this.reviews.listAdmin(query);
  }

  @Get('reviews/catalog')
  @Permissions('reviews.read')
  catalogReviews() {
    return this.reviews.catalog();
  }

  @Post('reviews')
  @Permissions('reviews.write')
  createReview(@Body() dto: CreateReviewDto) {
    return this.reviews.create(dto);
  }

  @Get('reviews/:id')
  @Permissions('reviews.read')
  getReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviews.findById(id);
  }

  @Patch('reviews/:id')
  @Permissions('reviews.write')
  updateReview(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
    return this.reviews.update(id, dto);
  }

  @Patch('reviews/:id/verify')
  @Permissions('reviews.write')
  verifyReview(@Param('id', ParseIntPipe) id: number, @Body() dto: VerifyReviewDto) {
    return this.reviews.verify(id, dto.isVerified);
  }

  @Delete('reviews/:id')
  @Permissions('reviews.delete')
  deleteReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviews.remove(id);
  }
}
