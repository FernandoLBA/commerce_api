import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Order, Shipment } from '../generated/prisma/client';

export interface EmailContext {
  [key: string]: any;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order: Order, customerEmail: string): Promise<void> {
    const itemsArray = (order as any).items || [];
    const itemsList = itemsArray
      .map((item: any) => `- ${item.productName} x${item.quantity}: S/. ${item.subtotal}`)
      .join('\n');

    const shippingAddress = order.shippingAddress as any;

    const text = `
¡Gracias por tu compra!

Tu pedido #${order.orderNumber} ha sido recibido.

Resumen del pedido:
${itemsList}

Subtotal: S/. ${order.subtotal}
Envío: S/. ${order.shippingCost}
${Number(order.discount) > 0 ? `Descuento: -S/. ${order.discount}` : ''}
Total: S/. ${order.total}

Dirección de envío:
${shippingAddress?.recipientName || ''}
${shippingAddress?.street || ''} ${shippingAddress?.number || ''}
${shippingAddress?.district || ''}, ${shippingAddress?.city || ''}
${shippingAddress?.department || ''}

Te notificaremos cuando tu pedido sea enviado.

¡Gracias por comprar con nosotros!
    `.trim();

    await this.sendEmail({
      to: customerEmail,
      subject: `Pedido confirmado #${order.orderNumber}`,
      text,
    });
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(
    order: Order,
    shipment: Shipment,
    customerEmail: string,
  ): Promise<void> {
    const trackingInfo = shipment.trackingNumber
      ? `\nNúmero de seguimiento: ${shipment.trackingNumber}${shipment.trackingUrl ? `\nRastrear envío: ${shipment.trackingUrl}` : ''}`
      : '';

    const shippingAddress = order.shippingAddress as any;
    const estimatedDate = shipment.estimatedDeliveryDate ? this.formatDate(shipment.estimatedDeliveryDate) : 'Por confirmar';

    const text = `
¡Tu pedido está en camino!

El pedido #${order.orderNumber} ha sido enviado.

Carrier: ${this.getCarrierName(shipment.carrier)}
${trackingInfo}

Fecha estimada de entrega: ${estimatedDate}

Dirección de entrega:
${shippingAddress?.recipientName || ''}
${shippingAddress?.street || ''} ${shippingAddress?.number || ''}
${shippingAddress?.district || ''}, ${shippingAddress?.city || ''}
${shippingAddress?.department || ''}

¡Gracias por tu compra!
    `.trim();

    await this.sendEmail({
      to: customerEmail,
      subject: `Tu pedido #${order.orderNumber} ha sido enviado`,
      text,
    });
  }

  /**
   * Send order delivered notification
   */
  async sendOrderDelivered(order: Order, customerEmail: string): Promise<void> {
    const text = `
¡Tu pedido ha sido entregado!

El pedido #${order.orderNumber} ha sido entregado exitosamente.

Esperamos que disfrutes tu compra. Si tienes algún problema o pregunta, no dudes en contactarnos.

¡Gracias por comprar con nosotros!
    `.trim();

    await this.sendEmail({
      to: customerEmail,
      subject: `Tu pedido #${order.orderNumber} ha sido entregado`,
      text,
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    order: Order,
    customerEmail: string,
    amount: number,
  ): Promise<void> {
    const text = `
¡Pago recibido!

Hemos recibido tu pago de S/. ${amount} para el pedido #${order.orderNumber}.

Tu pedido será procesado y enviado pronto.

¡Gracias por tu compra!
    `.trim();

    await this.sendEmail({
      to: customerEmail,
      subject: `Pago confirmado - Pedido #${order.orderNumber}`,
      text,
    });
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailed(
    order: Order,
    customerEmail: string,
    reason?: string,
  ): Promise<void> {
    const text = `
Hubo un problema con tu pago

No pudimos procesar el pago para el pedido #${order.orderNumber}.
${reason ? `\nMotivo: ${reason}` : ''}

Por favor, intenta nuevamente con otro método de pago o contacta con tu banco.

Si necesitas ayuda, no dudes en contactarnos.
    `.trim();

    await this.sendEmail({
      to: customerEmail,
      subject: `Problema con el pago - Pedido #${order.orderNumber}`,
      text,
    });
  }

  /**
   * Send order cancelled notification
   */
  async sendOrderCancelled(order: Order, customerEmail: string): Promise<void> {
    const text = `
Tu pedido ha sido cancelado

El pedido #${order.orderNumber} ha sido cancelado.

Si realizaste un pago, el reembolso será procesado en los próximos días hábiles.

Si tienes alguna pregunta, no dudes en contactarnos.
    `.trim();

    await this.sendEmail({
      to: customerEmail,
      subject: `Pedido cancelado #${order.orderNumber}`,
      text,
    });
  }

  /**
   * Send low stock alert to admin
   */
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

    const urgency = data.isCritical ? '🚨 CRÍTICO' : '⚠️ Bajo Stock';
    const skuInfo = data.sku ? ` (SKU: ${data.sku})` : '';

    const text = `
${urgency}: Alerta de Inventario

Producto: ${data.productName}${skuInfo}
Stock actual: ${data.currentStock} unidades
Umbral configurado: ${data.threshold} unidades

${data.isCritical ? 'ACCIÓN REQUERIDA: El stock ha llegado a nivel crítico.' : 'Se recomienda reabastecer pronto.'}

---
Este es un mensaje automático del sistema de inventario.
    `.trim();

    await this.sendEmail({
      to: adminEmail,
      subject: `${urgency}: ${data.productName} - Stock: ${data.currentStock}`,
      text,
    });
  }

  /**
   * Send generic email
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error: any) {
      // Log error but don't throw - emails are not critical
      console.error(`Failed to send email to ${options.to}:`, error.message);
    }
  }

  private getCarrierName(carrier: string): string {
    const names: Record<string, string> = {
      olva: 'Olva Courier',
      shalom: 'Shalom',
      cruz_del_sur: 'Cruz del Sur',
      servientrega: 'Servientrega',
      pickup: 'Recojo en tienda',
    };
    return names[carrier] || carrier;
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

  /**
   * Send account activation email
   */
  async sendActivationEmail(
    email: string,
    activationToken: string,
    firstName: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const activationUrl = `${frontendUrl}/auth/activate?token=${activationToken}`;

    const text = `
¡Hola ${firstName}!

Gracias por registrarte en nuestra tienda.

Para activar tu cuenta, haz clic en el siguiente enlace:
${activationUrl}

Este enlace expirará en 24 horas.

Si no creaste esta cuenta, puedes ignorar este correo.

¡Gracias!
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>¡Hola ${firstName}!</h1>
    <p>Gracias por registrarte en nuestra tienda.</p>
    <p>Para activar tu cuenta, haz clic en el siguiente botón:</p>
    <a href="${activationUrl}" class="button">Activar mi cuenta</a>
    <p>O copia y pega este enlace en tu navegador:</p>
    <p><a href="${activationUrl}">${activationUrl}</a></p>
    <p><strong>Este enlace expirará en 24 horas.</strong></p>
    <div class="footer">
      <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.sendEmail({
      to: email,
      subject: 'Activa tu cuenta',
      text,
      html,
    });
  }
}
