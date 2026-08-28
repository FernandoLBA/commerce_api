import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto';
import { NotFoundException, ValidationException } from '../common';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async addItem(userId: string, dto: AddToWishlistDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Check if variant exists (if provided)
    let variant: any = null;
    if (dto.variantId) {
      variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, productId: dto.productId },
      });

      if (!variant) {
        throw new NotFoundException(
          `Variant with ID ${dto.variantId} not found`,
        );
      }
    }

    // Check if already in wishlist
    const existing = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId || null,
      },
    });

    if (existing) {
      throw new ValidationException('Item is already in your wishlist');
    }

    const price = variant ? variant.price : product.price;

    return this.prisma.wishlistItem.create({
      data: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId,
        notes: dto.notes,
        priceWhenAdded: price,
        notifyOnPriceDrop: dto.notifyOnPriceDrop ?? false,
        notifyOnBackInStock: dto.notifyOnBackInStock ?? false,
      },
    });
  }

  async findAll(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: { include: { images: true } },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add current price and availability info
    return items.map((item) => ({
      ...item,
      currentPrice: item.variant?.price ?? item.product.price,
      isAvailable: (item.variant?.stock ?? item.product.stock) > 0,
      priceDrop:
        item.priceWhenAdded &&
        Number(item.priceWhenAdded) >
          Number(item.variant?.price ?? item.product.price)
          ? Number(item.priceWhenAdded) -
            Number(item.variant?.price ?? item.product.price)
          : 0,
    }));
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.wishlistItem.findFirst({
      where: { id, userId },
      include: {
        product: { include: { images: true } },
        variant: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return item;
  }

  async update(id: string, userId: string, dto: UpdateWishlistItemDto) {
    await this.findOne(id, userId);

    return this.prisma.wishlistItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.wishlistItem.delete({ where: { id } });
  }

  async removeByProduct(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<void> {
    const item = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
        variantId: variantId || null,
      },
    });

    if (item) {
      await this.prisma.wishlistItem.delete({ where: { id: item.id } });
    }
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({ where: { userId } });
  }

  async isInWishlist(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<boolean> {
    const item = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
        variantId: variantId || null,
      },
    });

    return !!item;
  }

  getWishlistCount(userId: string): Promise<number> {
    return this.prisma.wishlistItem.count({ where: { userId } });
  }

  async moveToCart(id: string, userId: string) {
    const item = await this.findOne(id, userId);

    // Mark for removal (cart service should call removeByProduct after adding)
    return item;
  }

  // For scheduled jobs: get items with price drop notifications enabled
  getItemsForPriceDropNotification() {
    return this.prisma.wishlistItem.findMany({
      where: { notifyOnPriceDrop: true },
      include: { user: true, product: true, variant: true },
    });
  }

  // For scheduled jobs: get items for back in stock notifications
  getItemsForBackInStockNotification() {
    return this.prisma.wishlistItem.findMany({
      where: { notifyOnBackInStock: true },
      include: { user: true, product: true, variant: true },
    });
  }
}
