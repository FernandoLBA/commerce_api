import { Test, TestingModule } from '@nestjs/testing';
import { ProductImageService } from './product-image.service';
import { PrismaService } from '../prisma';
import { FilesService } from '../files/files.service';

describe('ProductImageService', () => {
  let service: ProductImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductImageService,
        { provide: PrismaService, useValue: { productImage: { createMany: jest.fn() } } },
        { provide: FilesService, useValue: { getImagePublicId: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProductImageService>(ProductImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
