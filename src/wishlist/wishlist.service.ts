import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto';
import { NotFoundException, ValidationException } from '../common';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async addItem(userId: string, dto: AddToWishlistDto): Promise<WishlistItem> {
    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Check if variant exists (if provided)
    let variant: ProductVariant | null = null;
    if (dto.variantId) {
      variant = await this.variantRepository.findOne({
        where: { id: dto.variantId, productId: dto.productId },
      });

      if (!variant) {
        throw new NotFoundException(`Variant with ID ${dto.variantId} not found`);
      }
    }

    // Check if already in wishlist
    const existing = await this.wishlistRepository.findOne({
      where: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId || undefined,
      },
    });

    if (existing) {
      throw new ValidationException('Item is already in your wishlist');
    }

    const price = variant ? variant.price : product.price;

    const wishlistItem = this.wishlistRepository.create({
      userId,
      productId: dto.productId,
      variantId: dto.variantId,
      notes: dto.notes,
      priceWhenAdded: price,
      notifyOnPriceDrop: dto.notifyOnPriceDrop ?? false,
      notifyOnBackInStock: dto.notifyOnBackInStock ?? false,
    });

    return this.wishlistRepository.save(wishlistItem);
  }

  async findAll(userId: string): Promise<WishlistItem[]> {
    const items = await this.wishlistRepository.find({
      where: { userId },
      relations: ['product', 'product.images', 'variant'],
      order: { createdAt: 'DESC' },
    });

    // Add current price and availability info
    return items.map((item) => ({
      ...item,
      currentPrice: item.variant?.price ?? item.product.price,
      isAvailable: (item.variant?.stock ?? item.product.stock) > 0,
      priceDrop:
        item.priceWhenAdded && item.priceWhenAdded > (item.variant?.price ?? item.product.price)
          ? item.priceWhenAdded - (item.variant?.price ?? item.product.price)
          : 0,
    })) as any;
  }

  async findOne(id: string, userId: string): Promise<WishlistItem> {
    const item = await this.wishlistRepository.findOne({
      where: { id, userId },
      relations: ['product', 'product.images', 'variant'],
    });

    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return item;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateWishlistItemDto,
  ): Promise<WishlistItem> {
    const item = await this.findOne(id, userId);

    Object.assign(item, dto);

    return this.wishlistRepository.save(item);
  }

  async remove(id: string, userId: string): Promise<void> {
    const item = await this.findOne(id, userId);
    await this.wishlistRepository.remove(item);
  }

  async removeByProduct(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<void> {
    const item = await this.wishlistRepository.findOne({
      where: {
        userId,
        productId,
        variantId: variantId || undefined,
      },
    });

    if (item) {
      await this.wishlistRepository.remove(item);
    }
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.wishlistRepository.delete({ userId });
  }

  async isInWishlist(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<boolean> {
    const item = await this.wishlistRepository.findOne({
      where: {
        userId,
        productId,
        variantId: variantId || undefined,
      },
    });

    return !!item;
  }

  async getWishlistCount(userId: string): Promise<number> {
    return this.wishlistRepository.count({ where: { userId } });
  }

  async moveToCart(id: string, userId: string): Promise<WishlistItem> {
    const item = await this.findOne(id, userId);
    
    // Mark for removal (cart service should call removeByProduct after adding)
    return item;
  }

  // For scheduled jobs: get items with price drop notifications enabled
  async getItemsForPriceDropNotification(): Promise<WishlistItem[]> {
    return this.wishlistRepository.find({
      where: { notifyOnPriceDrop: true },
      relations: ['user', 'product', 'variant'],
    });
  }

  // For scheduled jobs: get items for back in stock notifications
  async getItemsForBackInStockNotification(): Promise<WishlistItem[]> {
    return this.wishlistRepository.find({
      where: { notifyOnBackInStock: true },
      relations: ['user', 'product', 'variant'],
    });
  }
}
