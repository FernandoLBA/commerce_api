import { Injectable } from '@nestjs/common';

import {
  ProductNotFoundException,
  ProductVariantNotFoundException,
  ValidationException,
} from '../common';
import { PrismaService } from '../prisma';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { displayOrder: 'asc' } },
              },
            },
            variant: {
              include: {
                attributeValues: {
                  include: {
                    attributeValue: {
                      include: {
                        attribute: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { displayOrder: 'asc' } },
                },
              },
              variant: {
                include: {
                  attributeValues: {
                    include: {
                      attributeValue: {
                        include: {
                          attribute: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const total = this.calculateTotal(cart.items);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...cart, total, itemCount };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, variantId, quantity } = addToCartDto;

    // Verify product exists and is active
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new ProductNotFoundException(
        `Product with ID "${productId}" not found or inactive`,
      );
    }

    // If product has variants, variant is required
    if (product.hasVariants && !variantId) {
      throw new ValidationException('Variant is required for this product');
    }

    let variant: {
      id: string;
      stock: number;
      productId: string;
      price: any;
    } | null = null;

    // Verify variant if provided
    if (variantId) {
      variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, productId, isActive: true },
      });

      if (!variant) {
        throw new ProductVariantNotFoundException(
          `Variant with ID "${variantId}" not found`,
        );
      }

      // Check stock
      if (variant.stock < quantity) {
        throw new ValidationException(
          `Insufficient stock. Available: ${variant.stock}`,
        );
      }
    } else {
      // Check product stock for non-variant products
      if (product.stock < quantity) {
        throw new ValidationException(
          `Insufficient stock. Available: ${product.stock}`,
        );
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
        throw new ValidationException(
          `Cannot add more. Available: ${availableStock}`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        },
      });
    }

    return this.getOrCreateCart(userId);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateDto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new ValidationException(`Cart item with ID "${itemId}" not found`);
    }

    // Check stock availability
    if (item.variant) {
      if (item.variant.stock < updateDto.quantity) {
        throw new ValidationException(
          `Insufficient stock. Available: ${item.variant.stock}`,
        );
      }
    } else {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (product && product.stock < updateDto.quantity) {
        throw new ValidationException(
          `Insufficient stock. Available: ${product.stock}`,
        );
      }
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateDto.quantity },
    });

    return this.getOrCreateCart(userId);
  }

  async removeCartItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new ValidationException(`Cart item with ID "${itemId}" not found`);
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  async validateCartForCheckout(
    userId: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const cart = await this.getOrCreateCart(userId);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    for (const item of cart.items) {
      // Check product availability
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
      });

      if (!product) {
        errors.push(
          `Product "${item.product?.name || item.productId}" is no longer available`,
        );
        continue;
      }

      // Check variant/stock
      if (item.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
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

  private calculateTotal(items: any[]): number {
    return items.reduce((total, item) => {
      // Get price from variant if exists, otherwise from product
      const price = item.variant
        ? Number(item.variant.price)
        : Number(item.product?.price || 0);
      return total + item.quantity * price;
    }, 0);
  }
}
