import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import {
  ProductNotFoundException,
  ProductVariantNotFoundException,
  ValidationException,
} from '../common';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.variant.attributeValues',
        'items.variant.attributeValues.attribute',
      ],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId, items: [] });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async getCart(userId: string): Promise<Cart & { total: number; itemCount: number }> {
    const cart = await this.getOrCreateCart(userId);
    const total = this.calculateTotal(cart.items);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...cart, total, itemCount };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, variantId, quantity } = addToCartDto;

    // Verify product exists and is active
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new ProductNotFoundException(`Product with ID "${productId}" not found or inactive`);
    }

    // If product has variants, variant is required
    if (product.hasVariants && !variantId) {
      throw new ValidationException('Variant is required for this product');
    }

    let variant: ProductVariant | null = null;
    let price = product.price;

    // Verify variant if provided
    if (variantId) {
      variant = await this.variantRepository.findOne({
        where: { id: variantId, product: { id: productId }, isActive: true },
      });

      if (!variant) {
        throw new ProductVariantNotFoundException(`Variant with ID "${variantId}" not found`);
      }

      // Check stock
      if (variant.stock < quantity) {
        throw new ValidationException(`Insufficient stock. Available: ${variant.stock}`);
      }

      price = variant.price;
    } else {
      // Check product stock for non-variant products
      if (product.stock < quantity) {
        throw new ValidationException(`Insufficient stock. Available: ${product.stock}`);
      }
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.productId === productId && item.variantId === variantId,
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const availableStock = variant ? variant.stock : product.stock;

      if (newQuantity > availableStock) {
        throw new ValidationException(`Cannot add more. Available: ${availableStock}`);
      }

      existingItem.quantity = newQuantity;
      existingItem.unitPrice = price;
      await this.cartItemRepository.save(existingItem);
    } else {
      // Add new item
      const cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        variantId,
        quantity,
        unitPrice: price,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.getOrCreateCart(userId);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new ValidationException(`Cart item with ID "${itemId}" not found`);
    }

    // Check stock availability
    if (item.variant) {
      if (item.variant.stock < updateDto.quantity) {
        throw new ValidationException(`Insufficient stock. Available: ${item.variant.stock}`);
      }
    } else {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (product && product.stock < updateDto.quantity) {
        throw new ValidationException(`Insufficient stock. Available: ${product.stock}`);
      }
    }

    item.quantity = updateDto.quantity;
    await this.cartItemRepository.save(item);

    return this.getOrCreateCart(userId);
  }

  async removeCartItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new ValidationException(`Cart item with ID "${itemId}" not found`);
    }

    await this.cartItemRepository.remove(item);

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.remove(cart.items);
  }

  async validateCartForCheckout(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const cart = await this.getOrCreateCart(userId);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    for (const item of cart.items) {
      // Check product availability
      const product = await this.productRepository.findOne({
        where: { id: item.productId, isActive: true },
      });

      if (!product) {
        errors.push(`Product "${item.product?.name || item.productId}" is no longer available`);
        continue;
      }

      // Check variant/stock
      if (item.variantId) {
        const variant = await this.variantRepository.findOne({
          where: { id: item.variantId, isActive: true },
        });

        if (!variant) {
          errors.push(`Variant for "${product.name}" is no longer available`);
        } else if (variant.stock < item.quantity) {
          errors.push(
            `Insufficient stock for "${product.name}". Available: ${variant.stock}, Requested: ${item.quantity}`,
          );
        }
      } else if (product.stock < item.quantity) {
        errors.push(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
      return total + item.quantity * Number(item.unitPrice);
    }, 0);
  }
}
