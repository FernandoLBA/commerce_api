import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { ValidationException, NotFoundException, ForbiddenException } from '../common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: jest.Mocked<Repository<Review>>;
  let orderRepository: jest.Mocked<Repository<Order>>;

  const mockReview = {
    id: 'review-1',
    userId: 'user-1',
    productId: 'product-1',
    rating: 5,
    title: 'Great product!',
    comment: 'Love it',
    isVerifiedPurchase: true,
    isApproved: true,
    helpfulCount: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'review-1', ...data })),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get(getRepositoryToken(Review));
    orderRepository = module.get(getRepositoryToken(Order));
  });

  describe('create', () => {
    it('should create a review', async () => {
      reviewRepository.findOne.mockResolvedValue(null);
      
      const result = await service.create('user-1', {
        productId: 'product-1',
        rating: 5,
        title: 'Great!',
        comment: 'Love it',
      });

      expect(result.rating).toBe(5);
      expect(reviewRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user already reviewed product', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview as Review);

      await expect(
        service.create('user-1', {
          productId: 'product-1',
          rating: 5,
        }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('findAll', () => {
    it('should return paginated reviews', async () => {
      reviewRepository.findAndCount.mockResolvedValue([[mockReview as Review], 1]);

      const result = await service.findAll('product-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a review', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview as Review);

      const result = await service.findOne('review-1');

      expect(result.id).toBe('review-1');
    });

    it('should throw error if review not found', async () => {
      reviewRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update own review', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview as Review);

      const result = await service.update('review-1', 'user-1', { rating: 4 });

      expect(reviewRepository.save).toHaveBeenCalled();
    });

    it('should throw error when updating other user review', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview as Review);

      await expect(
        service.update('review-1', 'other-user', { rating: 4 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any review', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview as Review);

      await service.update('review-1', 'admin-user', { isApproved: false }, true);

      expect(reviewRepository.save).toHaveBeenCalled();
    });
  });

  describe('markHelpful', () => {
    it('should increment helpful count', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview as Review);

      const result = await service.markHelpful('review-1', 'other-user');

      expect(reviewRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ helpfulCount: 1 }),
      );
    });

    it('should throw error when marking own review', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview as Review);

      await expect(
        service.markHelpful('review-1', 'user-1'),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('getProductRating', () => {
    it('should calculate average rating', async () => {
      reviewRepository.find.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
      ] as Review[]);

      const result = await service.getProductRating('product-1');

      expect(result.averageRating).toBe(4.7);
      expect(result.totalReviews).toBe(3);
      expect(result.ratingDistribution[5]).toBe(2);
      expect(result.ratingDistribution[4]).toBe(1);
    });

    it('should return zeros for product without reviews', async () => {
      reviewRepository.find.mockResolvedValue([]);

      const result = await service.getProductRating('product-1');

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });
  });
});
