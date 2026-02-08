import { wrapInHtmlTemplate, emailFooter } from './base.template';

export interface OrderShippedData {
  orderNumber: string;
  carrierName: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate: string;
  shippingAddress: {
    recipientName?: string;
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    department?: string;
  };
}

export function orderShippedEmailText(data: OrderShippedData): string {
  const trackingInfo = data.trackingNumber
    ? `\nNúmero de seguimiento: ${data.trackingNumber}${data.trackingUrl ? `\nRastrear envío: ${data.trackingUrl}` : ''}`
    : '';

  const addr = data.shippingAddress;

  return `
¡Tu pedido está en camino!

El pedido #${data.orderNumber} ha sido enviado.

Carrier: ${data.carrierName}
${trackingInfo}

Fecha estimada de entrega: ${data.estimatedDeliveryDate}

Dirección de entrega:
${addr.recipientName || ''}
${addr.street || ''} ${addr.number || ''}
${addr.district || ''}, ${addr.city || ''}
${addr.department || ''}

¡Gracias por tu compra!
  `.trim();
}

export function orderShippedEmailHtml(data: OrderShippedData): string {
  const addr = data.shippingAddress;
  const trackingHtml = data.trackingNumber
    ? `
      <p><strong>Número de seguimiento:</strong> ${data.trackingNumber}</p>
      ${data.trackingUrl ? `<p><a href="${data.trackingUrl}" style="color: #204DC6;">Rastrear mi envío</a></p>` : ''}
    `
    : '';

  const content = `
    <h1>¡Tu pedido está en camino!</h1>
    <p>El pedido <strong>#${data.orderNumber}</strong> ha sido enviado.</p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Carrier:</strong> ${data.carrierName}</p>
      ${trackingHtml}
      <p><strong>Fecha estimada de entrega:</strong> ${data.estimatedDeliveryDate}</p>
    </div>
    
    <h2>Dirección de entrega</h2>
    <p>
      ${addr.recipientName || ''}<br>
      ${addr.street || ''} ${addr.number || ''}<br>
      ${addr.district || ''}, ${addr.city || ''}<br>
      ${addr.department || ''}
    </p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderShippedEmailSubject(orderNumber: string): string {
  return `Tu pedido #${orderNumber} ha sido enviado`;
}
