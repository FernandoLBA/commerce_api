import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  NotFoundException,
  ValidationException,
  ForbiddenException,
} from '../common';

export interface ProductRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId,
        productId: createReviewDto.productId,
      },
    });

    if (existingReview) {
      throw new ValidationException('You have already reviewed this product');
    }

    // Check if user purchased the product
    const isVerifiedPurchase = await this.checkVerifiedPurchase(
      userId,
      createReviewDto.productId,
    );

    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId,
      isVerifiedPurchase,
    });

    return this.reviewRepository.save(review);
  }

  async findAll(
    productId?: string,
    page = 1,
    limit = 10,
    onlyVerified = false,
  ): Promise<{ data: Review[]; total: number }> {
    const where: any = { isApproved: true };
    
    if (productId) {
      where.productId = productId;
    }
    
    if (onlyVerified) {
      where.isVerifiedPurchase = true;
    }

    const [data, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        user: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
    isAdmin = false,
  ): Promise<Review> {
    const review = await this.findOne(id);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Users can only update rating, title, comment, images
    if (!isAdmin) {
      const { rating, title, comment, images } = updateReviewDto;
      Object.assign(review, { rating, title, comment, images });
    } else {
      // Admins can update approval and response
      if (updateReviewDto.isApproved !== undefined) {
        review.isApproved = updateReviewDto.isApproved;
      }
      if (updateReviewDto.adminResponse) {
        review.adminResponse = updateReviewDto.adminResponse;
        review.adminResponseAt = new Date();
      }
    }

    return this.reviewRepository.save(review);
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const review = await this.findOne(id);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);
  }

  async markHelpful(id: string, userId: string): Promise<Review> {
    const review = await this.findOne(id);

    if (review.userId === userId) {
      throw new ValidationException('You cannot mark your own review as helpful');
    }

    review.helpfulCount++;
    return this.reviewRepository.save(review);
  }

  async getProductRating(productId: string): Promise<ProductRating> {
    const reviews = await this.reviewRepository.find({
      where: { productId, isApproved: true },
      select: ['rating'],
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const review of reviews) {
      sum += review.rating;
      distribution[review.rating as keyof typeof distribution]++;
    }

    return {
      averageRating: Math.round((sum / reviews.length) * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
    };
  }

  async getPendingReviews(page = 1, limit = 20): Promise<{ data: Review[]; total: number }> {
    const [data, total] = await this.reviewRepository.findAndCount({
      where: { isApproved: false },
      relations: ['user', 'product'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  private async checkVerifiedPurchase(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .where('order.userId = :userId', { userId })
      .andWhere('item.productId = :productId', { productId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['delivered', 'completed'],
      })
      .getOne();

    return !!order;
  }
}
