import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma';
import { PaymentStatus, OrderStatus } from '../generated/prisma/client';
import { ValidationException } from '../common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  async createPaymentIntent(orderId: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
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
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: paymentIntent.id,
        externalStatus: paymentIntent.status,
        status: PaymentStatus.PROCESSING,
      },
    });

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
    const payment = await this.prisma.payment.findFirst({
      where: { externalId: paymentIntent.id },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        externalStatus: paymentIntent.status,
        externalData: paymentIntent as any,
        completedAt: new Date(),
      },
    });

    // Update order status
    if (payment.order.status === OrderStatus.PENDING) {
      await this.prisma.order.update({
        where: { id: payment.order.id },
        data: {
          status: OrderStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });

      // Send payment confirmation email
      try {
        const orderWithItems = await this.prisma.order.findUnique({
          where: { id: payment.order.id },
          include: { items: true, user: true },
        });
        if (orderWithItems?.user?.email) {
          await this.notificationsService.sendPaymentConfirmation(
            orderWithItems,
            orderWithItems.user.email,
            Number(payment.order.total),
          );
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { externalId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        externalStatus: paymentIntent.status,
        errorCode: paymentIntent.last_payment_error?.code || 'unknown',
        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
        externalData: paymentIntent as any,
      },
    });

    // Send payment failed email
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true, user: true },
      });
      if (order?.user?.email) {
        await this.notificationsService.sendPaymentFailed(
          order,
          order.user.email,
          paymentIntent.last_payment_error?.message || 'Payment failed',
        );
      }
    } catch (emailError) {
      console.error('Failed to send payment failed email:', emailError);
    }
  }

  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    const paymentIntent = charge.payment_intent as string;

    const payment = await this.prisma.payment.findFirst({
      where: { externalId: paymentIntent },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment not found for refund: ${paymentIntent}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAmount: charge.amount_refunded / 100,
        refundId: charge.refunds?.data?.[0]?.id,
        refundedAt: new Date(),
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.order.id },
      data: { status: OrderStatus.REFUNDED },
    });
  }

  async createRefund(paymentId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
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

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundId: refund.id,
        refundedAmount: refundAmount,
        refundedAt: new Date(),
      },
    });
  }
}
