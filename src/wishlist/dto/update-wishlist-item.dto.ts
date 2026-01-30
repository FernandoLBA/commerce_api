import { PartialType, OmitType } from '@nestjs/mapped-types';
import { AddToWishlistDto } from './add-to-wishlist.dto';

export class UpdateWishlistItemDto extends PartialType(
  OmitType(AddToWishlistDto, ['productId', 'variantId'] as const),
) {}
