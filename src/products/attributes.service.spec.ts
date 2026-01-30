import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributesService } from './attributes.service';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { AttributeNotFoundException, AttributeAlreadyExistsException } from '../common';

describe('AttributesService', () => {
  let service: AttributesService;
  let attributesRepository: jest.Mocked<Repository<ProductAttribute>>;
  let valuesRepository: jest.Mocked<Repository<ProductAttributeValue>>;

  const mockAttribute: ProductAttribute = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Size',
    type: 'select',
    values: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAttributeValue: ProductAttributeValue = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    value: 'M',
    displayValue: null,
    attribute: mockAttribute,
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAttributesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockValuesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findByIds: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributesService,
        {
          provide: getRepositoryToken(ProductAttribute),
          useValue: mockAttributesRepository,
        },
        {
          provide: getRepositoryToken(ProductAttributeValue),
          useValue: mockValuesRepository,
        },
      ],
    }).compile();

    service = module.get<AttributesService>(AttributesService);
    attributesRepository = module.get(getRepositoryToken(ProductAttribute));
    valuesRepository = module.get(getRepositoryToken(ProductAttributeValue));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAttribute', () => {
    it('should create a new attribute', async () => {
      const createDto = { name: 'Size', type: 'select' as const };
      attributesRepository.findOne.mockResolvedValue(null);
      attributesRepository.create.mockReturnValue(mockAttribute);
      attributesRepository.save.mockResolvedValue(mockAttribute);

      const result = await service.createAttribute(createDto);

      expect(result).toEqual(mockAttribute);
      expect(attributesRepository.create).toHaveBeenCalledWith(createDto);
      expect(attributesRepository.save).toHaveBeenCalled();
    });

    it('should throw AttributeAlreadyExistsException if name exists', async () => {
      const createDto = { name: 'Size', type: 'select' as const };
      attributesRepository.findOne.mockResolvedValue(mockAttribute);

      await expect(service.createAttribute(createDto)).rejects.toThrow(
        AttributeAlreadyExistsException,
      );
    });
  });

  describe('findAllAttributes', () => {
    it('should return all attributes with values', async () => {
      const attributes = [mockAttribute];
      attributesRepository.find.mockResolvedValue(attributes);

      const result = await service.findAllAttributes();

      expect(result).toEqual(attributes);
      expect(attributesRepository.find).toHaveBeenCalledWith({
        relations: ['values'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('findAttributeById', () => {
    it('should return an attribute by id', async () => {
      attributesRepository.findOne.mockResolvedValue(mockAttribute);

      const result = await service.findAttributeById(mockAttribute.id);

      expect(result).toEqual(mockAttribute);
    });

    it('should throw AttributeNotFoundException if not found', async () => {
      attributesRepository.findOne.mockResolvedValue(null);

      await expect(service.findAttributeById('nonexistent')).rejects.toThrow(
        AttributeNotFoundException,
      );
    });
  });

  describe('updateAttribute', () => {
    it('should update an attribute', async () => {
      const updateDto = { name: 'Talla' };
      const updatedAttribute = { ...mockAttribute, ...updateDto };

      attributesRepository.findOne
        .mockResolvedValueOnce(mockAttribute) // findAttributeById
        .mockResolvedValueOnce(null); // check name uniqueness
      attributesRepository.save.mockResolvedValue(updatedAttribute);

      const result = await service.updateAttribute(mockAttribute.id, updateDto);

      expect(result.name).toEqual('Talla');
    });

    it('should throw AttributeAlreadyExistsException if new name exists', async () => {
      const updateDto = { name: 'Color' };
      const existingAttribute = { ...mockAttribute, id: 'other-id', name: 'Color' };

      attributesRepository.findOne
        .mockResolvedValueOnce(mockAttribute) // findAttributeById
        .mockResolvedValueOnce(existingAttribute); // check name uniqueness

      await expect(service.updateAttribute(mockAttribute.id, updateDto)).rejects.toThrow(
        AttributeAlreadyExistsException,
      );
    });
  });

  describe('deleteAttribute', () => {
    it('should delete an attribute', async () => {
      attributesRepository.findOne.mockResolvedValue(mockAttribute);
      attributesRepository.remove.mockResolvedValue(mockAttribute);

      await service.deleteAttribute(mockAttribute.id);

      expect(attributesRepository.remove).toHaveBeenCalledWith(mockAttribute);
    });
  });

  describe('createAttributeValue', () => {
    it('should create a new attribute value', async () => {
      const createDto = {
        attributeId: mockAttribute.id,
        value: 'M',
      };

      attributesRepository.findOne.mockResolvedValue(mockAttribute);
      valuesRepository.create.mockReturnValue(mockAttributeValue);
      valuesRepository.save.mockResolvedValue(mockAttributeValue);

      const result = await service.createAttributeValue(createDto);

      expect(result).toEqual(mockAttributeValue);
    });
  });

  describe('findAttributeValueById', () => {
    it('should return a value by id', async () => {
      valuesRepository.findOne.mockResolvedValue(mockAttributeValue);

      const result = await service.findAttributeValueById(mockAttributeValue.id);

      expect(result).toEqual(mockAttributeValue);
    });

    it('should throw AttributeNotFoundException if not found', async () => {
      valuesRepository.findOne.mockResolvedValue(null);

      await expect(service.findAttributeValueById('nonexistent')).rejects.toThrow(
        AttributeNotFoundException,
      );
    });
  });

  describe('findAttributeValuesByIds', () => {
    it('should return values by ids', async () => {
      const values = [mockAttributeValue];
      valuesRepository.findByIds.mockResolvedValue(values);

      const result = await service.findAttributeValuesByIds([mockAttributeValue.id]);

      expect(result).toEqual(values);
    });
  });

  describe('deleteAttributeValue', () => {
    it('should delete a value', async () => {
      valuesRepository.findOne.mockResolvedValue(mockAttributeValue);
      valuesRepository.remove.mockResolvedValue(mockAttributeValue);

      await service.deleteAttributeValue(mockAttributeValue.id);

      expect(valuesRepository.remove).toHaveBeenCalledWith(mockAttributeValue);
    });
  });
});
