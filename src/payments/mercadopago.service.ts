import { Injectable } from '@nestjs/common';
import { OrderStatus, Payment, PaymentStatus } from '@prisma/client';
import MercadoPagoConfig, {
  Payment as MPPayment,
  Preference,
} from 'mercadopago';

import { ValidationException } from '../common';
import { NotificationsService } from '../notifications';
import { PrismaService } from '../prisma';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private preference: Preference;
  private mpPayment: MPPayment;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });
    this.preference = new Preference(this.client);
    this.mpPayment = new MPPayment(this.client);
  }

  async createPreference(
    orderId: string,
  ): Promise<{
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        user: true,
      },
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

    // Create MercadoPago Preference
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    const preferenceData = {
      body: {
        items: order.items.map((item) => ({
          id: item.productId,
          title: item.productName,
          description: item.variantAttributes
            ? (item.variantAttributes as any[])
                .map((a) => `${a.name}: ${a.value}`)
                .join(', ')
            : undefined,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: 'PEN',
        })),
        payer: {
          // Will be filled by MercadoPago checkout
        },
        back_urls: {
          success: `${baseUrl}/payments/mercadopago/success`,
          failure: `${baseUrl}/payments/mercadopago/failure`,
          pending: `${baseUrl}/payments/mercadopago/pending`,
        },
        auto_return: 'approved' as const,
        external_reference: order.id,
        notification_url: `${baseUrl}/payments/mercadopago/webhook`,
        statement_descriptor: 'MI TIENDA',
        shipments: {
          cost: Number(order.shippingCost),
          mode: 'not_specified' as const,
        },
        metadata: {
          order_id: order.id,
          order_number: order.orderNumber,
          payment_id: payment.id,
        },
      },
    };

    const response = await this.preference.create(preferenceData);

    // Update payment with MercadoPago info
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: response.id,
        status: PaymentStatus.PROCESSING,
      },
    });

    return {
      preferenceId: response.id!,
      initPoint: response.init_point!,
      sandboxInitPoint: response.sandbox_init_point!,
    };
  }

  async handleWebhook(body: any): Promise<{ received: boolean }> {
    const { type, data } = body;

    if (type === 'payment') {
      await this.handlePaymentNotification(data.id);
    }

    return { received: true };
  }

  private async handlePaymentNotification(paymentId: string): Promise<void> {
    try {
      const mpPaymentData = await this.mpPayment.get({ id: paymentId });

      const externalReference = mpPaymentData.external_reference;
      if (!externalReference) {
        console.error('No external reference in MercadoPago payment');
        return;
      }

      const order = await this.prisma.order.findUnique({
        where: { id: externalReference },
        include: {
          payments: true,
          items: true,
          user: true,
        },
      });

      if (!order) {
        console.error(`Order not found: ${externalReference}`);
        return;
      }

      const payment = order.payments.find(
        (p) =>
          p.status === PaymentStatus.PROCESSING ||
          p.status === PaymentStatus.PENDING,
      );

      if (!payment) {
        console.error('No pending payment found for order');
        return;
      }

      // Update payment based on MercadoPago status
      const updateData: any = {
        externalId: String(mpPaymentData.id),
        externalStatus: mpPaymentData.status,
        externalData: mpPaymentData as any,
      };

      switch (mpPaymentData.status) {
        case 'approved':
          updateData.status = PaymentStatus.COMPLETED;
          updateData.completedAt = new Date();

          // Update order status
          if (order.status === OrderStatus.PENDING) {
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.CONFIRMED,
                confirmedAt: new Date(),
              },
            });

            // Send payment confirmation email
            try {
              if (order.user?.email) {
                await this.notificationsService.sendPaymentConfirmation(
                  order as any,
                  order.user.email,
                  Number(order.total),
                );
              }
            } catch (emailError) {
              console.error(
                'Failed to send payment confirmation email:',
                emailError,
              );
            }
          }
          break;

        case 'pending':
        case 'in_process':
          updateData.status = PaymentStatus.PROCESSING;
          break;

        case 'rejected':
        case 'cancelled':
          updateData.status = PaymentStatus.FAILED;
          updateData.errorCode = mpPaymentData.status_detail || 'rejected';
          updateData.errorMessage = this.getStatusDetailMessage(
            mpPaymentData.status_detail,
          );

          // Send payment failed email
          try {
            if (order.user?.email) {
              await this.notificationsService.sendPaymentFailed(
                order as any,
                order.user.email,
                updateData.errorMessage,
              );
            }
          } catch (emailError) {
            console.error('Failed to send payment failed email:', emailError);
          }
          break;

        case 'refunded':
          updateData.status = PaymentStatus.REFUNDED;
          updateData.refundedAt = new Date();
          updateData.refundedAmount = Number(mpPaymentData.transaction_amount);
          break;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: updateData,
      });
    } catch (error) {
      console.error('Error handling MercadoPago notification:', error);
    }
  }

  async getPaymentStatus(externalId: string): Promise<any> {
    return this.mpPayment.get({ id: externalId });
  }

  async createRefund(paymentId: string, amount?: number): Promise<Payment> {
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

    // MercadoPago refund
    const refundAmount = amount || Number(payment.amount);

    // Note: MercadoPago SDK refund implementation
    // In production, you would call the refund API
    // For now, we'll update the local record

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAmount: refundAmount,
        refundedAt: new Date(),
      },
    });

    return updatedPayment;
  }

  private getStatusDetailMessage(statusDetail: string | undefined): string {
    const messages: Record<string, string> = {
      accredited: 'Payment accredited',
      pending_contingency: 'Payment pending',
      pending_review_manual: 'Payment under review',
      cc_rejected_bad_filled_card_number: 'Check card number',
      cc_rejected_bad_filled_date: 'Check expiration date',
      cc_rejected_bad_filled_other: 'Check card details',
      cc_rejected_bad_filled_security_code: 'Check security code',
      cc_rejected_blacklist: 'Card not allowed',
      cc_rejected_call_for_authorize: 'Call to authorize',
      cc_rejected_card_disabled: 'Card disabled',
      cc_rejected_duplicated_payment: 'Duplicated payment',
      cc_rejected_high_risk: 'Payment rejected',
      cc_rejected_insufficient_amount: 'Insufficient funds',
      cc_rejected_invalid_installments: 'Invalid installments',
      cc_rejected_max_attempts: 'Max attempts reached',
      cc_rejected_other_reason: 'Payment rejected',
    };

    return messages[statusDetail || ''] || 'Payment rejected';
  }
}
