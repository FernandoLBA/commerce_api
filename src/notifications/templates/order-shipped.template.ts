import {
  wrapInHtmlTemplate,
  emailFooter,
  primaryButton,
  inline,
  colors,
  brandName,
} from './base.template';

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
    ? `\nTracking number: ${data.trackingNumber}${data.trackingUrl ? `\nTrack shipment: ${data.trackingUrl}` : ''}`
    : '';

  const addr = data.shippingAddress;

  return `
Your order is on its way!

Order #${data.orderNumber} has been shipped.

Carrier: ${data.carrierName}
${trackingInfo}

Estimated delivery date: ${data.estimatedDeliveryDate}

Delivery address:
${addr.recipientName || ''}
${addr.street || ''} ${addr.number || ''}
${addr.district || ''}, ${addr.city || ''}
${addr.department || ''}

Thank you for shopping at ${brandName}!
  `.trim();
}

export function orderShippedEmailHtml(data: OrderShippedData): string {
  const addr = data.shippingAddress;
  const trackingSection = data.trackingNumber
    ? `
      <p style="margin: 8px 0; color: ${colors.textSecondary};"><strong>Tracking number:</strong> ${data.trackingNumber}</p>
      ${
        data.trackingUrl
          ? `
        <div style="margin-top: 16px;">
          ${primaryButton('Track my shipment', data.trackingUrl)}
        </div>
      `
          : ''
      }
    `
    : '';

  const content = `
    <h1 style="${inline.heading1}">Your order is on its way! 🚚</h1>
    <p style="${inline.paragraph}">Order <strong>#${data.orderNumber}</strong> has been shipped.</p>

    <div style="background-color: ${colors.background}; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="font-size: 32px; margin-right: 12px;">📦</span>
        <div>
          <p style="margin: 0; font-weight: 600; color: ${colors.text};">${data.carrierName}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: ${colors.textMuted};">Shipping service</p>
        </div>
      </div>
      ${trackingSection}
      <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid ${colors.border};">
        <strong>📅 Estimated delivery date:</strong><br>
        <span style="color: ${colors.primary}; font-weight: 600;">${data.estimatedDeliveryDate}</span>
      </p>
    </div>

    <h2 style="${inline.heading2}">Delivery address</h2>
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
  return `🚚 Your order #${orderNumber} is on its way`;
}
