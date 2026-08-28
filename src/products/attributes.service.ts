import { Injectable } from '@nestjs/common';

import {
  AttributeAlreadyExistsException,
  AttributeNotFoundException,
} from '../common';
import { PrismaService } from '../prisma';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Injectable()
export class AttributesService {
  constructor(private prisma: PrismaService) {}

  // =============== ATTRIBUTES ===============

  async createAttribute(createAttributeDto: CreateAttributeDto) {
    const existing = await this.prisma.productAttribute.findFirst({
      where: { name: createAttributeDto.name },
    });

    if (existing) {
      throw new AttributeAlreadyExistsException(
        `Attribute with name "${createAttributeDto.name}" already exists`,
      );
    }

    return this.prisma.productAttribute.create({
      data: createAttributeDto,
    });
  }

  findAllAttributes() {
    return this.prisma.productAttribute.findMany({
      include: { values: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAttributeById(id: string) {
    const attribute = await this.prisma.productAttribute.findUnique({
      where: { id },
      include: { values: true },
    });

    if (!attribute) {
      throw new AttributeNotFoundException(
        `Attribute with ID "${id}" not found`,
      );
    }

    return attribute;
  }

  async updateAttribute(id: string, updateAttributeDto: UpdateAttributeDto) {
    const attribute = await this.findAttributeById(id);

    if (updateAttributeDto.name && updateAttributeDto.name !== attribute.name) {
      const existing = await this.prisma.productAttribute.findFirst({
        where: { name: updateAttributeDto.name },
      });

      if (existing) {
        throw new AttributeAlreadyExistsException(
          `Attribute with name "${updateAttributeDto.name}" already exists`,
        );
      }
    }

    return this.prisma.productAttribute.update({
      where: { id },
      data: updateAttributeDto,
    });
  }

  async deleteAttribute(id: string): Promise<void> {
    await this.findAttributeById(id);
    await this.prisma.productAttribute.delete({ where: { id } });
  }

  // =============== ATTRIBUTE VALUES ===============

  async createAttributeValue(createAttributeValueDto: CreateAttributeValueDto) {
    await this.findAttributeById(createAttributeValueDto.attributeId);

    return this.prisma.productAttributeValue.create({
      data: {
        value: createAttributeValueDto.value,
        attributeId: createAttributeValueDto.attributeId,
      },
    });
  }

  async findAttributeValueById(id: string) {
    const value = await this.prisma.productAttributeValue.findUnique({
      where: { id },
      include: { attribute: true },
    });

    if (!value) {
      throw new AttributeNotFoundException(
        `Attribute value with ID "${id}" not found`,
      );
    }

    return value;
  }

  findAttributeValuesByIds(ids: string[]) {
    return this.prisma.productAttributeValue.findMany({
      where: { id: { in: ids } },
    });
  }

  async updateAttributeValue(
    id: string,
    updateAttributeValueDto: UpdateAttributeValueDto,
  ) {
    await this.findAttributeValueById(id);

    return this.prisma.productAttributeValue.update({
      where: { id },
      data: updateAttributeValueDto,
    });
  }

  async deleteAttributeValue(id: string): Promise<void> {
    await this.findAttributeValueById(id);
    await this.prisma.productAttributeValue.delete({ where: { id } });
  }
}
