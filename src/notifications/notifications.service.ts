import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Order, Shipment } from '../generated/prisma/client';
import * as templates from './templates';

@Injectable()
export class NotificationsService {
  private readonly frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:3000';

  constructor(private readonly mailerService: MailerService) {}

  async sendActivationEmail(
    email: string,
    activationToken: string,
    firstName: string,
  ): Promise<void> {
    const data = {
      firstName,
      activationUrl: `${this.frontendUrl}/auth/activate-account/${activationToken}`,
    };
    await this.send(
      email,
      templates.activationEmailSubject,
      templates.activationEmailText(data),
      templates.activationEmailHtml(data),
    );
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName: string,
  ): Promise<void> {
    const data = {
      firstName,
      resetUrl: `${this.frontendUrl}/auth/password-reset/${resetToken}`,
    };
    await this.send(
      email,
      templates.passwordResetEmailSubject,
      templates.passwordResetEmailText(data),
      templates.passwordResetEmailHtml(data),
    );
  }

  async sendOrderConfirmation(
    order: Order,
    customerEmail: string,
  ): Promise<void> {
    const data = {
      orderNumber: order.orderNumber,
      items: ((order as any).items || []).map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      shippingAddress: this.extractShippingAddress(order),
    };
    await this.send(
      customerEmail,
      templates.orderConfirmationEmailSubject(order.orderNumber),
      templates.orderConfirmationEmailText(data),
      templates.orderConfirmationEmailHtml(data),
    );
  }

  async sendOrderShipped(
    order: Order,
    shipment: Shipment,
    customerEmail: string,
  ): Promise<void> {
    const data = {
      orderNumber: order.orderNumber,
      carrierName: this.getCarrierName(shipment.carrier),
      trackingNumber: shipment.trackingNumber || undefined,
      trackingUrl: shipment.trackingUrl || undefined,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate
        ? this.formatDate(shipment.estimatedDeliveryDate)
        : 'Por confirmar',
      shippingAddress: this.extractShippingAddress(order),
    };
    await this.send(
      customerEmail,
      templates.orderShippedEmailSubject(order.orderNumber),
      templates.orderShippedEmailText(data),
      templates.orderShippedEmailHtml(data),
    );
  }

  async sendOrderDelivered(order: Order, customerEmail: string): Promise<void> {
    const data = { orderNumber: order.orderNumber };
    await this.send(
      customerEmail,
      templates.orderDeliveredEmailSubject(order.orderNumber),
      templates.orderDeliveredEmailText(data),
      templates.orderDeliveredEmailHtml(data),
    );
  }

  async sendOrderCancelled(order: Order, customerEmail: string): Promise<void> {
    const data = { orderNumber: order.orderNumber };
    await this.send(
      customerEmail,
      templates.orderCancelledEmailSubject(order.orderNumber),
      templates.orderCancelledEmailText(data),
      templates.orderCancelledEmailHtml(data),
    );
  }

  async sendPaymentConfirmation(
    order: Order,
    customerEmail: string,
    amount: number,
  ): Promise<void> {
    const data = { orderNumber: order.orderNumber, amount };
    await this.send(
      customerEmail,
      templates.paymentConfirmationEmailSubject(order.orderNumber),
      templates.paymentConfirmationEmailText(data),
      templates.paymentConfirmationEmailHtml(data),
    );
  }

  async sendPaymentFailed(
    order: Order,
    customerEmail: string,
    reason?: string,
  ): Promise<void> {
    const data = { orderNumber: order.orderNumber, reason };
    await this.send(
      customerEmail,
      templates.paymentFailedEmailSubject(order.orderNumber),
      templates.paymentFailedEmailText(data),
      templates.paymentFailedEmailHtml(data),
    );
  }

  async sendLowStockAlert(data: {
    productName: string;
    sku?: string;
    currentStock: number;
    threshold: number;
    isCritical: boolean;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USER;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured, skipping low stock alert');
      return;
    }
    await this.send(
      adminEmail,
      templates.lowStockAlertEmailSubject(data),
      templates.lowStockAlertEmailText(data),
    );
  }

  private extractShippingAddress(order: Order) {
    const addr = order.shippingAddress as any;
    return {
      recipientName: addr?.recipientName,
      street: addr?.street,
      number: addr?.number,
      district: addr?.district,
      city: addr?.city,
      department: addr?.department,
    };
  }

  private async send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
      await this.mailerService.sendMail({ to, subject, text, html });
  }

  private getCarrierName(carrier: string): string {
    const carriers: Record<string, string> = {
      olva: 'Olva Courier',
      shalom: 'Shalom',
      cruz_del_sur: 'Cruz del Sur',
      servientrega: 'Servientrega',
      pickup: 'Recojo en tienda',
    };
    return carriers[carrier] || carrier;
  }

  private formatDate(date: Date): string {
    if (!date) return 'Por confirmar';
    return new Date(date).toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
