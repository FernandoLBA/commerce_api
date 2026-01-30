import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { CartService } from '../cart/cart.service';
import { Address } from '../users/entities/address.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import {
  ValidationException,
  AddressNotFoundException,
} from '../common';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private cartService: CartService,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // Validate cart
    const validation = await this.cartService.validateCartForCheckout(userId);
    if (!validation.valid) {
      throw new ValidationException(validation.errors.join('. '));
    }

    // Get cart with items
    const cart = await this.cartService.getCart(userId);

    // Get shipping address
    const address = await this.addressRepository.findOne({
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const order = this.orderRepository.create({
        orderNumber,
        userId,
        status: OrderStatus.PENDING,
        shippingAddress: {
          recipientName: address.recipientName,
          recipientPhone: address.phone,
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
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create order items from cart
      for (const cartItem of cart.items) {
        // Get price from variant if exists, otherwise from product
        const unitPrice = cartItem.variant ? Number(cartItem.variant.price) : Number(cartItem.product.price);
        
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: cartItem.productId,
          productName: cartItem.product.name,
          variantId: cartItem.variantId,
          variantAttributes: cartItem.variant?.attributeValues?.map((av) => ({
            name: av.attribute?.name || '',
            value: av.value,
          })),
          unitPrice,
          quantity: cartItem.quantity,
          subtotal: cartItem.quantity * unitPrice,
        });

        await queryRunner.manager.save(orderItem);

        // Reserve stock
        if (cartItem.variantId) {
          await queryRunner.manager.decrement(
            ProductVariant,
            { id: cartItem.variantId },
            'stock',
            cartItem.quantity,
          );
        } else {
          await queryRunner.manager.decrement(
            Product,
            { id: cartItem.productId },
            'stock',
            cartItem.quantity,
          );
        }
      }

      // Create initial payment record
      const payment = this.paymentRepository.create({
        orderId: savedOrder.id,
        method: createOrderDto.paymentMethod,
        status: PaymentStatus.PENDING,
        amount: total,
        currency: 'PEN',
      });

      await queryRunner.manager.save(payment);

      // Clear cart
      await this.cartService.clearCart(userId);

      await queryRunner.commitTransaction();

      return this.findOne(savedOrder.id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId?: string, isAdmin = false): Promise<Order[]> {
    const where = isAdmin ? {} : { userId };

    return this.orderRepository.find({
      where,
      relations: ['items', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.orderRepository.findOne({
      where,
      relations: ['items', 'payments', 'user'],
    });

    if (!order) {
      throw new ValidationException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string, userId?: string): Promise<Order> {
    const where: any = { orderNumber };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.orderRepository.findOne({
      where,
      relations: ['items', 'payments'],
    });

    if (!order) {
      throw new ValidationException(`Order "${orderNumber}" not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Handle status changes
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
      this.setStatusTimestamp(order, updateOrderDto.status);
    }

    Object.assign(order, updateOrderDto);
    await this.orderRepository.save(order);

    return this.findOne(id);
  }

  async cancel(id: string, userId?: string): Promise<Order> {
    const order = await this.findOne(id, userId);

    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new ValidationException('Order cannot be cancelled at this stage');
    }

    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        await this.variantRepository.increment(
          { id: item.variantId },
          'stock',
          item.quantity,
        );
      } else {
        await this.productRepository.increment(
          { id: item.productId },
          'stock',
          item.quantity,
        );
      }
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();

    // Cancel pending payments
    for (const payment of order.payments) {
      if (payment.status === PaymentStatus.PENDING) {
        payment.status = PaymentStatus.CANCELLED;
        await this.paymentRepository.save(payment);
      }
    }

    await this.orderRepository.save(order);

    return this.findOne(id);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Get count of orders this month
    const count = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();

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

  private validateStatusTransition(current: OrderStatus, next: OrderStatus): void {
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

  private setStatusTimestamp(order: Order, status: OrderStatus): void {
    const now = new Date();
    switch (status) {
      case OrderStatus.CONFIRMED:
        order.confirmedAt = now;
        break;
      case OrderStatus.SHIPPED:
        order.shippedAt = now;
        break;
      case OrderStatus.DELIVERED:
        order.deliveredAt = now;
        break;
      case OrderStatus.CANCELLED:
        order.cancelledAt = now;
        break;
    }
  }
}
