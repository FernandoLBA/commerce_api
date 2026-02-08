import { wrapInHtmlTemplate, emailFooter } from './base.template';

export interface OrderConfirmationData {
  orderNumber: string;
  items: Array<{
    productName: string;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: {
    recipientName?: string;
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    department?: string;
  };
}

export function orderConfirmationEmailText(data: OrderConfirmationData): string {
  const itemsList = data.items
    .map((item) => `- ${item.productName} x${item.quantity}: S/. ${item.subtotal}`)
    .join('\n');

  const addr = data.shippingAddress;

  return `
¡Gracias por tu compra!

Tu pedido #${data.orderNumber} ha sido recibido.

Resumen del pedido:
${itemsList}

Subtotal: S/. ${data.subtotal}
Envío: S/. ${data.shippingCost}
${data.discount > 0 ? `Descuento: -S/. ${data.discount}` : ''}
Total: S/. ${data.total}

Dirección de envío:
${addr.recipientName || ''}
${addr.street || ''} ${addr.number || ''}
${addr.district || ''}, ${addr.city || ''}
${addr.department || ''}

Te notificaremos cuando tu pedido sea enviado.

¡Gracias por comprar con nosotros!
  `.trim();
}

export function orderConfirmationEmailHtml(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">S/. ${item.subtotal}</td>
      </tr>
    `,
    )
    .join('');

  const addr = data.shippingAddress;

  const content = `
    <h1>¡Gracias por tu compra!</h1>
    <p>Tu pedido <strong>#${data.orderNumber}</strong> ha sido recibido.</p>
    
    <h2 style="margin-top: 30px;">Resumen del pedido</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Producto</th>
          <th style="padding: 8px; text-align: center;">Cantidad</th>
          <th style="padding: 8px; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div style="margin-top: 20px; text-align: right;">
      <p>Subtotal: <strong>S/. ${data.subtotal}</strong></p>
      <p>Envío: <strong>S/. ${data.shippingCost}</strong></p>
      ${data.discount > 0 ? `<p>Descuento: <strong>-S/. ${data.discount}</strong></p>` : ''}
      <p style="font-size: 18px;">Total: <strong>S/. ${data.total}</strong></p>
    </div>
    
    <h2 style="margin-top: 30px;">Dirección de envío</h2>
    <p>
      ${addr.recipientName || ''}<br>
      ${addr.street || ''} ${addr.number || ''}<br>
      ${addr.district || ''}, ${addr.city || ''}<br>
      ${addr.department || ''}
    </p>
    
    <p style="margin-top: 20px;">Te notificaremos cuando tu pedido sea enviado.</p>
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderConfirmationEmailSubject(orderNumber: string): string {
  return `Pedido confirmado #${orderNumber}`;
}
