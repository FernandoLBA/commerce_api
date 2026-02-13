import { wrapInHtmlTemplate, emailFooter, primaryButton, inline, colors, brandName } from './base.template';

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

¡Gracias por comprar en ${brandName}!
  `.trim();
}

export function orderShippedEmailHtml(data: OrderShippedData): string {
  const addr = data.shippingAddress;
  const trackingSection = data.trackingNumber
    ? `
      <p style="margin: 8px 0; color: ${colors.textSecondary};"><strong>Número de seguimiento:</strong> ${data.trackingNumber}</p>
      ${data.trackingUrl ? `
        <div style="margin-top: 16px;">
          ${primaryButton('Rastrear mi envío', data.trackingUrl)}
        </div>
      ` : ''}
    `
    : '';

  const content = `
    <h1 style="${inline.heading1}">¡Tu pedido está en camino! 🚚</h1>
    <p style="${inline.paragraph}">El pedido <strong>#${data.orderNumber}</strong> ha sido enviado.</p>
    
    <div style="background-color: ${colors.background}; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="font-size: 32px; margin-right: 12px;">📦</span>
        <div>
          <p style="margin: 0; font-weight: 600; color: ${colors.text};">${data.carrierName}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: ${colors.textMuted};">Servicio de envío</p>
        </div>
      </div>
      ${trackingSection}
      <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid ${colors.border};">
        <strong>📅 Fecha estimada de entrega:</strong><br>
        <span style="color: ${colors.primary}; font-weight: 600;">${data.estimatedDeliveryDate}</span>
      </p>
    </div>
    
    <h2 style="${inline.heading2}">Dirección de entrega</h2>
    <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px;">
      <p style="margin: 0; color: ${colors.text};">
        <strong>${addr.recipientName || ''}</strong><br>
        ${addr.street || ''} ${addr.number || ''}<br>
        ${addr.district || ''}, ${addr.city || ''}<br>
        ${addr.department || ''}
      </p>
    </div>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderShippedEmailSubject(orderNumber: string): string {
  return `🚚 Tu pedido #${orderNumber} está en camino`;
}
