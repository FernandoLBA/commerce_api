import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment } from '../orders/entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentStatus } from '../orders/enums/payment-status.enum';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { ValidationException } from '../common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private notificationsService: NotificationsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-01-28.clover',
    });
  }

  async createPaymentIntent(orderId: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new ValidationException('Order not found');
    }

    const payment = order.payments.find(
      (p) => p.status === PaymentStatus.PENDING,
    );

    if (!payment) {
      throw new ValidationException('No pending payment found for this order');
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100), // Convert to cents
      currency: 'pen',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: payment.id,
      },
    });

    // Update payment with Stripe info
    payment.externalId = paymentIntent.id;
    payment.externalStatus = paymentIntent.status;
    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new ValidationException('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new ValidationException(`Webhook signature verification failed`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: paymentIntent.id },
      relations: ['order'],
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.externalStatus = paymentIntent.status;
    payment.externalData = paymentIntent as any;
    payment.completedAt = new Date();
    await this.paymentRepository.save(payment);

    // Update order status
    const order = payment.order;
    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      await this.orderRepository.save(order);

      // Send payment confirmation email
      try {
        const orderWithItems = await this.orderRepository.findOne({
          where: { id: order.id },
          relations: ['items', 'user'],
        });
        if (orderWithItems?.user?.email) {
          await this.notificationsService.sendPaymentConfirmation(
            orderWithItems,
            orderWithItems.user.email,
            Number(order.total),
          );
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.externalStatus = paymentIntent.status;
    payment.errorCode = paymentIntent.last_payment_error?.code || 'unknown';
    payment.errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
    payment.externalData = paymentIntent as any;
    await this.paymentRepository.save(payment);

    // Send payment failed email
    try {
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
        relations: ['items', 'user'],
      });
      if (order?.user?.email) {
        await this.notificationsService.sendPaymentFailed(
          order,
          order.user.email,
          payment.errorMessage,
        );
      }
    } catch (emailError) {
      console.error('Failed to send payment failed email:', emailError);
    }
  }

  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    const paymentIntent = charge.payment_intent as string;

    const payment = await this.paymentRepository.findOne({
      where: { externalId: paymentIntent },
      relations: ['order'],
    });

    if (!payment) {
      console.error(`Payment not found for refund: ${paymentIntent}`);
      return;
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAmount = charge.amount_refunded / 100;
    payment.refundId = charge.refunds?.data?.[0]?.id;
    payment.refundedAt = new Date();
    await this.paymentRepository.save(payment);

    // Update order status
    const order = payment.order;
    order.status = OrderStatus.REFUNDED;
    await this.orderRepository.save(order);
  }

  async createRefund(paymentId: string, amount?: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new ValidationException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new ValidationException('Only completed payments can be refunded');
    }

    if (!payment.externalId) {
      throw new ValidationException('Payment has no external reference');
    }

    const refundAmount = amount || Number(payment.amount);

    const refund = await this.stripe.refunds.create({
      payment_intent: payment.externalId,
      amount: Math.round(refundAmount * 100),
    });

    payment.status = PaymentStatus.REFUNDED;
    payment.refundId = refund.id;
    payment.refundedAmount = refundAmount;
    payment.refundedAt = new Date();
    await this.paymentRepository.save(payment);

    return payment;
  }
}
