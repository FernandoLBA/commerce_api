import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import {
  AttributeNotFoundException,
  AttributeAlreadyExistsException,
} from '../common';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(ProductAttribute)
    private attributesRepository: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeValue)
    private attributeValuesRepository: Repository<ProductAttributeValue>,
  ) {}

  // =============== ATTRIBUTES ===============

  async createAttribute(createAttributeDto: CreateAttributeDto): Promise<ProductAttribute> {
    const existing = await this.attributesRepository.findOne({
      where: { name: createAttributeDto.name },
    });

    if (existing) {
      throw new AttributeAlreadyExistsException(
        `Attribute with name "${createAttributeDto.name}" already exists`,
      );
    }

    const attribute = this.attributesRepository.create(createAttributeDto);
    return this.attributesRepository.save(attribute);
  }

  async findAllAttributes(): Promise<ProductAttribute[]> {
    return this.attributesRepository.find({
      relations: ['values'],
      order: { name: 'ASC' },
    });
  }

  async findAttributeById(id: string): Promise<ProductAttribute> {
    const attribute = await this.attributesRepository.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!attribute) {
      throw new AttributeNotFoundException(`Attribute with ID "${id}" not found`);
    }

    return attribute;
  }

  async updateAttribute(
    id: string,
    updateAttributeDto: UpdateAttributeDto,
  ): Promise<ProductAttribute> {
    const attribute = await this.findAttributeById(id);

    if (updateAttributeDto.name && updateAttributeDto.name !== attribute.name) {
      const existing = await this.attributesRepository.findOne({
        where: { name: updateAttributeDto.name },
      });

      if (existing) {
        throw new AttributeAlreadyExistsException(
          `Attribute with name "${updateAttributeDto.name}" already exists`,
        );
      }
    }

    Object.assign(attribute, updateAttributeDto);
    return this.attributesRepository.save(attribute);
  }

  async deleteAttribute(id: string): Promise<void> {
    const attribute = await this.findAttributeById(id);
    await this.attributesRepository.remove(attribute);
  }

  // =============== ATTRIBUTE VALUES ===============

  async createAttributeValue(
    createAttributeValueDto: CreateAttributeValueDto,
  ): Promise<ProductAttributeValue> {
    const attribute = await this.findAttributeById(createAttributeValueDto.attributeId);

    const attributeValue = this.attributeValuesRepository.create({
      ...createAttributeValueDto,
      attribute,
    });

    return this.attributeValuesRepository.save(attributeValue);
  }

  async findAttributeValueById(id: string): Promise<ProductAttributeValue> {
    const value = await this.attributeValuesRepository.findOne({
      where: { id },
      relations: ['attribute'],
    });

    if (!value) {
      throw new AttributeNotFoundException(`Attribute value with ID "${id}" not found`);
    }

    return value;
  }

  async findAttributeValuesByIds(ids: string[]): Promise<ProductAttributeValue[]> {
    return this.attributeValuesRepository.findByIds(ids);
  }

  async updateAttributeValue(
    id: string,
    updateAttributeValueDto: UpdateAttributeValueDto,
  ): Promise<ProductAttributeValue> {
    const value = await this.findAttributeValueById(id);
    Object.assign(value, updateAttributeValueDto);
    return this.attributeValuesRepository.save(value);
  }

  async deleteAttributeValue(id: string): Promise<void> {
    const value = await this.findAttributeValueById(id);
    await this.attributeValuesRepository.remove(value);
  }
}
