import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('productId') productId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('verified', new DefaultValuePipe(false), ParseBoolPipe) onlyVerified?: boolean,
  ) {
    return this.reviewsService.findAll(productId, page, limit, onlyVerified);
  }

  @Get('product/:productId/rating')
  @Public()
  getProductRating(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getProductRating(productId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  findMyReviews(@CurrentUser('id') userId: string) {
    return this.reviewsService.findByUser(userId);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPendingReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getPendingReviews(page, limit);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(
      id,
      userId,
      updateReviewDto,
      role === Role.ADMIN,
    );
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  markHelpful(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.markHelpful(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.reviewsService.remove(id, userId, role === Role.ADMIN);
  }
}
