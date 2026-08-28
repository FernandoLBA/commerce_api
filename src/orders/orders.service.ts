import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

import { CartService } from '../cart/cart.service';
import { AddressNotFoundException, ValidationException } from '../common';
import { PrismaService } from '../prisma';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    // Validate cart
    const validation = await this.cartService.validateCartForCheckout(userId);
    if (!validation.valid) {
      throw new ValidationException(validation.errors.join('. '));
    }

    // Get cart with items
    const cart = await this.cartService.getCart(userId);

    // Get shipping address
    const address = await this.prisma.address.findFirst({
      where: { id: createOrderDto.shippingAddressId, userId },
    });

    if (!address) {
      throw new AddressNotFoundException('Shipping address not found');
    }

    // Calculate totals
    const subtotal = cart.total;
    const shippingCost = this.calculateShippingCost(address.department);
    const discount = 0; // TODO: Implement discount code validation
    const total = subtotal + shippingCost - discount;

    // Use transaction for order creation
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const savedOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          shippingAddress: {
            recipientName: address.recipientName,
            recipientPhone: address.recipientPhone,
            street: address.street,
            number: address.number,
            apartment: address.apartment,
            district: address.district,
            city: address.city,
            department: address.department,
            postalCode: address.postalCode,
            reference: address.reference,
          },
          subtotal,
          shippingCost,
          discount,
          total,
          discountCode: createOrderDto.discountCode,
          notes: createOrderDto.notes,
        },
      });

      // Create order items from cart
      for (const cartItem of cart.items) {
        // Get price from variant if exists, otherwise from product
        const unitPrice = cartItem.variant
          ? Number(cartItem.variant.price)
          : Number(cartItem.product.price);

        await tx.orderItem.create({
          data: {
            orderId: savedOrder.id,
            productId: cartItem.productId,
            productName: cartItem.product.name,
            variantId: cartItem.variantId,
            variantAttributes: cartItem.variant?.attributeValues?.map(
              (av: any) => ({
                name: av.attribute?.name || '',
                value: av.value,
              }),
            ),
            unitPrice,
            quantity: cartItem.quantity,
            subtotal: cartItem.quantity * unitPrice,
          },
        });

        // Reserve stock
        if (cartItem.variantId) {
          await tx.productVariant.update({
            where: { id: cartItem.variantId },
            data: { stock: { decrement: cartItem.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: cartItem.productId },
            data: { stock: { decrement: cartItem.quantity } },
          });
        }
      }

      // Create initial payment record
      await tx.payment.create({
        data: {
          orderId: savedOrder.id,
          method: createOrderDto.paymentMethod,
          status: PaymentStatus.PENDING,
          amount: total,
          currency: 'PEN',
        },
      });

      return savedOrder;
    });

    // Clear cart
    await this.cartService.clearCart(userId);

    return this.findOne(result.id, userId);
  }

  async findAll(userId?: string, isAdmin = false) {
    const where: Prisma.OrderWhereInput = isAdmin ? {} : { userId };

    return this.prisma.order.findMany({
      where,
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const where: Prisma.OrderWhereInput = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: { items: true, payments: true, user: true },
    });

    if (!order) {
      throw new ValidationException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string, userId?: string) {
    const where: Prisma.OrderWhereInput = { orderNumber };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: { items: true, payments: true },
    });

    if (!order) {
      throw new ValidationException(`Order "${orderNumber}" not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    // Handle status changes
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
    }

    const updateData: Prisma.OrderUpdateInput = { ...updateOrderDto };

    // Set status timestamps
    if (updateOrderDto.status) {
      const timestamp = this.getStatusTimestamp(updateOrderDto.status);
      if (timestamp) {
        Object.assign(updateData, timestamp);
      }
    }

    await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(id);
  }

  async cancel(id: string, userId?: string) {
    const order = await this.findOne(id, userId);

    const cancelableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
    ];
    if (!cancelableStatuses.includes(order.status)) {
      throw new ValidationException('Order cannot be cancelled at this stage');
    }

    // Restore stock
    for (const item of (order as any).items) {
      if (item.variantId) {
        await this.prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // Cancel pending payments
    for (const payment of (order as any).payments) {
      if (payment.status === PaymentStatus.PENDING) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.CANCELLED },
        });
      }
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    return this.findOne(id);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Get count of orders this month
    const count = await this.prisma.order.count({
      where: {
        orderNumber: { startsWith: prefix },
      },
    });

    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }

  private calculateShippingCost(department: string): number {
    // Shipping costs for Peru (simplified)
    const limaMetro = ['Lima', 'Callao'];
    if (limaMetro.includes(department)) {
      return 10.0; // S/. 10 for Lima Metro
    }
    return 20.0; // S/. 20 for other departments
  }

  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new ValidationException(
        `Cannot transition order from "${current}" to "${next}"`,
      );
    }
  }

  private getStatusTimestamp(
    status: OrderStatus,
  ): Partial<Prisma.OrderUpdateInput> | null {
    const now = new Date();
    switch (status) {
      case OrderStatus.CONFIRMED:
        return { confirmedAt: now };
      case OrderStatus.SHIPPED:
        return { shippedAt: now };
      case OrderStatus.DELIVERED:
        return { deliveredAt: now };
      case OrderStatus.CANCELLED:
        return { cancelledAt: now };
      default:
        return null;
    }
  }
}
