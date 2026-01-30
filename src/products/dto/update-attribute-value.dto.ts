import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAttributeValueDto } from './create-attribute-value.dto';

export class UpdateAttributeValueDto extends PartialType(
  OmitType(CreateAttributeValueDto, ['attributeId'] as const),
) {}
