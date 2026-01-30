import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagesService } from './images.service';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { ProductNotFoundException, ProductImageNotFoundException, CloudinaryService } from '../common';

describe('ImagesService', () => {
  let service: ImagesService;
  let imagesRepository: jest.Mocked<Repository<ProductImage>>;
  let productsRepository: jest.Mocked<Repository<Product>>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const mockProduct: Partial<Product> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
  };

  const mockImage: Partial<ProductImage> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    url: 'https://cloudinary.com/image1.jpg',
    thumbnailUrl: 'https://cloudinary.com/image1_thumb.jpg',
    publicId: 'products/image1',
    altText: 'Test image',
    position: 0,
    isPrimary: true,
    product: mockProduct as Product,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockImagesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockProductsRepository = {
      findOne: jest.fn(),
    };

    const mockCloudinaryService = {
      uploadFromBuffer: jest.fn(),
      uploadFromUrl: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      getResponsiveUrls: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockImagesRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    imagesRepository = module.get(getRepositoryToken(ProductImage));
    productsRepository = module.get(getRepositoryToken(Product));
    cloudinaryService = module.get(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new image', async () => {
      const createDto = {
        url: 'https://cloudinary.com/new-image.jpg',
        altText: 'New image',
      };

      productsRepository.findOne.mockResolvedValue(mockProduct as Product);
      imagesRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 0 }),
      } as any);
      imagesRepository.create.mockReturnValue(mockImage as ProductImage);
      imagesRepository.save.mockResolvedValue(mockImage as ProductImage);

      const result = await service.create(mockProduct.id!, createDto);

      expect(result).toEqual(mockImage);
    });

    it('should throw ProductNotFoundException if product does not exist', async () => {
      productsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('nonexistent', { url: 'https://test.com/img.jpg' }),
      ).rejects.toThrow(ProductNotFoundException);
    });

    it('should reset primary images when creating a primary image', async () => {
      const createDto = {
        url: 'https://cloudinary.com/new-image.jpg',
        isPrimary: true,
      };

      productsRepository.findOne.mockResolvedValue(mockProduct as Product);
      imagesRepository.update.mockResolvedValue({ affected: 1 } as any);
      imagesRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 0 }),
      } as any);
      imagesRepository.create.mockReturnValue(mockImage as ProductImage);
      imagesRepository.save.mockResolvedValue(mockImage as ProductImage);

      await service.create(mockProduct.id!, createDto);

      expect(imagesRepository.update).toHaveBeenCalledWith(
        { product: { id: mockProduct.id }, isPrimary: true },
        { isPrimary: false },
      );
    });
  });

  describe('findAllByProduct', () => {
    it('should return all images for a product', async () => {
      const images = [mockImage as ProductImage];
      imagesRepository.find.mockResolvedValue(images);

      const result = await service.findAllByProduct(mockProduct.id!);

      expect(result).toEqual(images);
      expect(imagesRepository.find).toHaveBeenCalledWith({
        where: { product: { id: mockProduct.id } },
        order: { position: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an image by id', async () => {
      imagesRepository.findOne.mockResolvedValue(mockImage as ProductImage);

      const result = await service.findOne(mockImage.id!);

      expect(result).toEqual(mockImage);
    });

    it('should throw ProductImageNotFoundException if not found', async () => {
      imagesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        ProductImageNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an image', async () => {
      const updateDto = { altText: 'Updated alt text' };
      const updatedImage = { ...mockImage, ...updateDto };

      imagesRepository.findOne.mockResolvedValue(mockImage as ProductImage);
      imagesRepository.save.mockResolvedValue(updatedImage as ProductImage);

      const result = await service.update(mockImage.id!, updateDto);

      expect(result.altText).toEqual('Updated alt text');
    });

    it('should reset primary images when setting as primary', async () => {
      const updateDto = { isPrimary: true };
      const nonPrimaryImage = { ...mockImage, isPrimary: false };

      imagesRepository.findOne.mockResolvedValue(nonPrimaryImage as ProductImage);
      imagesRepository.update.mockResolvedValue({ affected: 1 } as any);
      imagesRepository.save.mockResolvedValue({ ...nonPrimaryImage, isPrimary: true } as ProductImage);

      await service.update(mockImage.id!, updateDto);

      expect(imagesRepository.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an image', async () => {
      imagesRepository.findOne.mockResolvedValue(mockImage as ProductImage);
      imagesRepository.remove.mockResolvedValue(mockImage as ProductImage);
      cloudinaryService.delete.mockResolvedValue(true);

      await service.remove(mockImage.id!);

      expect(cloudinaryService.delete).toHaveBeenCalledWith(mockImage.publicId);
      expect(imagesRepository.remove).toHaveBeenCalledWith(mockImage);
    });
  });

  describe('setPrimary', () => {
    it('should set an image as primary', async () => {
      const nonPrimaryImage = { ...mockImage, isPrimary: false };

      imagesRepository.findOne.mockResolvedValue(nonPrimaryImage as ProductImage);
      imagesRepository.update.mockResolvedValue({ affected: 1 } as any);
      imagesRepository.save.mockResolvedValue({ ...nonPrimaryImage, isPrimary: true } as ProductImage);

      const result = await service.setPrimary(mockImage.id!);

      expect(result.isPrimary).toBe(true);
      expect(imagesRepository.update).toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('should reorder images', async () => {
      const images = [
        { ...mockImage, id: 'img-1', position: 0 },
        { ...mockImage, id: 'img-2', position: 1 },
      ] as ProductImage[];

      imagesRepository.find.mockResolvedValue(images);
      imagesRepository.save.mockImplementation((img) => Promise.resolve(img as ProductImage));

      const result = await service.reorder(mockProduct.id!, ['img-2', 'img-1']);

      expect(imagesRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
