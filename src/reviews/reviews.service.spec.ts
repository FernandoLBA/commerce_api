import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: {
    review: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
    };
    product: {
      findUnique: jest.Mock;
    };
    order: {
      findFirst: jest.Mock;
    };
    reviewVote: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  const userId = 'user-uuid-123';
  const productId = 'product-uuid-123';

  const mockReview = {
    id: 'review-uuid-123',
    userId,
    productId,
    rating: 5,
    title: 'Great Product',
    content: 'I love this product!',
    isVerifiedPurchase: true,
    helpfulCount: 0,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      review: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
      order: {
        findFirst: jest.fn(),
      },
      reviewVote: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a review by id', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findOne(mockReview.id);

      expect(result).toEqual(mockReview);
    });
  });

  describe('findByUser', () => {
    it('should return user reviews', async () => {
      prisma.review.findMany.mockResolvedValue([mockReview]);

      const result = await service.findByUser(userId);

      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update a review', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue({ ...mockReview, rating: 4 });

      const result = await service.update(mockReview.id, userId, { rating: 4 });

      expect(result.rating).toBe(4);
    });
  });

  describe('remove', () => {
    it('should remove a review', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.delete.mockResolvedValue(mockReview);

      await service.remove(mockReview.id, userId);

      expect(prisma.review.delete).toHaveBeenCalledWith({
        where: { id: mockReview.id },
      });
    });
  });
});
