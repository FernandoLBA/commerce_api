import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  NotFoundException,
  ValidationException,
  ForbiddenException,
} from '../common';
import { Prisma, OrderStatus } from '../generated/prisma/client';

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
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
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

    return this.prisma.review.create({
      data: {
        ...createReviewDto,
        userId,
        isVerifiedPurchase,
      },
    });
  }

  async findAll(
    productId?: string,
    page = 1,
    limit = 10,
    onlyVerified = false,
  ) {
    const where: Prisma.ReviewWhereInput = { isApproved: true };
    
    if (productId) {
      where.productId = productId;
    }
    
    if (onlyVerified) {
      where.isVerifiedPurchase = true;
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { user: true, product: true },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
    isAdmin = false,
  ) {
    const review = await this.findOne(id);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updateData: Prisma.ReviewUpdateInput = {};

    // Users can only update rating, title, comment, images
    if (!isAdmin) {
      if (updateReviewDto.rating !== undefined) updateData.rating = updateReviewDto.rating;
      if (updateReviewDto.title !== undefined) updateData.title = updateReviewDto.title;
      if (updateReviewDto.comment !== undefined) updateData.comment = updateReviewDto.comment;
      if (updateReviewDto.images !== undefined) updateData.images = updateReviewDto.images;
    } else {
      // Admins can update approval and response
      if (updateReviewDto.isApproved !== undefined) {
        updateData.isApproved = updateReviewDto.isApproved;
      }
      if (updateReviewDto.adminResponse) {
        updateData.adminResponse = updateReviewDto.adminResponse;
        updateData.adminResponseAt = new Date();
      }
    }

    return this.prisma.review.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const review = await this.findOne(id);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id } });
  }

  async markHelpful(id: string, userId: string) {
    const review = await this.findOne(id);

    if (review.userId === userId) {
      throw new ValidationException('You cannot mark your own review as helpful');
    }

    return this.prisma.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });
  }

  async getProductRating(productId: string): Promise<ProductRating> {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      select: { rating: true },
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

  async getPendingReviews(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { isApproved: false },
        include: { user: true, product: true },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where: { isApproved: false } }),
    ]);

    return { data, total };
  }

  private async checkVerifiedPurchase(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: { in: [OrderStatus.DELIVERED] },
        items: {
          some: { productId },
        },
      },
    });

    return !!order;
  }
}
