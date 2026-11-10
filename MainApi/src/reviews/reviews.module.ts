import { Module } from '@nestjs/common';
import { AdminReviewsController } from './admin-reviews.controller';
import { CabinetReviewsController } from './cabinet-reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [AdminReviewsController, CabinetReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
