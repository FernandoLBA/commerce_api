import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import { Payment } from '../orders/entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentStatus } from '../orders/enums/payment-status.enum';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { ValidationException } from '../common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private preference: Preference;
  private mpPayment: MPPayment;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private notificationsService: NotificationsService,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });
    this.preference = new Preference(this.client);
    this.mpPayment = new MPPayment(this.client);
  }

  async createPreference(orderId: string): Promise<{
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments', 'items'],
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
            ? item.variantAttributes.map((a) => `${a.name}: ${a.value}`).join(', ')
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
    payment.externalId = response.id;
    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

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

      const order = await this.orderRepository.findOne({
        where: { id: externalReference },
        relations: ['payments'],
      });

      if (!order) {
        console.error(`Order not found: ${externalReference}`);
        return;
      }

      const payment = order.payments.find(
        (p) => p.status === PaymentStatus.PROCESSING || p.status === PaymentStatus.PENDING,
      );

      if (!payment) {
        console.error('No pending payment found for order');
        return;
      }

      // Update payment based on MercadoPago status
      payment.externalId = String(mpPaymentData.id);
      payment.externalStatus = mpPaymentData.status;
      payment.externalData = mpPaymentData as any;

      switch (mpPaymentData.status) {
        case 'approved':
          payment.status = PaymentStatus.COMPLETED;
          payment.completedAt = new Date();
          
          // Update order status
          if (order.status === OrderStatus.PENDING) {
            order.status = OrderStatus.CONFIRMED;
            order.confirmedAt = new Date();
            await this.orderRepository.save(order);

            // Send payment confirmation email
            try {
              const orderWithUser = await this.orderRepository.findOne({
                where: { id: order.id },
                relations: ['items', 'user'],
              });
              if (orderWithUser?.user?.email) {
                await this.notificationsService.sendPaymentConfirmation(
                  orderWithUser,
                  orderWithUser.user.email,
                  Number(order.total),
                );
              }
            } catch (emailError) {
              console.error('Failed to send payment confirmation email:', emailError);
            }
          }
          break;

        case 'pending':
        case 'in_process':
          payment.status = PaymentStatus.PROCESSING;
          break;

        case 'rejected':
        case 'cancelled':
          payment.status = PaymentStatus.FAILED;
          payment.errorCode = mpPaymentData.status_detail || 'rejected';
          payment.errorMessage = this.getStatusDetailMessage(mpPaymentData.status_detail);
          
          // Send payment failed email
          try {
            const orderWithUser = await this.orderRepository.findOne({
              where: { id: order.id },
              relations: ['items', 'user'],
            });
            if (orderWithUser?.user?.email) {
              await this.notificationsService.sendPaymentFailed(
                orderWithUser,
                orderWithUser.user.email,
                payment.errorMessage,
              );
            }
          } catch (emailError) {
            console.error('Failed to send payment failed email:', emailError);
          }
          break;

        case 'refunded':
          payment.status = PaymentStatus.REFUNDED;
          payment.refundedAt = new Date();
          payment.refundedAmount = Number(mpPaymentData.transaction_amount);
          break;
      }

      await this.paymentRepository.save(payment);
    } catch (error) {
      console.error('Error handling MercadoPago notification:', error);
    }
  }

  async getPaymentStatus(externalId: string): Promise<any> {
    return this.mpPayment.get({ id: externalId });
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

    // MercadoPago refund
    const refundAmount = amount || Number(payment.amount);
    
    // Note: MercadoPago SDK refund implementation
    // In production, you would call the refund API
    // For now, we'll update the local record
    
    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAmount = refundAmount;
    payment.refundedAt = new Date();
    await this.paymentRepository.save(payment);

    return payment;
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
