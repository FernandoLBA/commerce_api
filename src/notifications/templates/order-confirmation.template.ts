import {
  wrapInHtmlTemplate,
  emailFooter,
  inline,
  colors,
  brandName,
} from './base.template';

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

export function orderConfirmationEmailText(
  data: OrderConfirmationData,
): string {
  const itemsList = data.items
    .map(
      (item) =>
        `- ${item.productName} x${item.quantity}: S/. ${item.subtotal.toFixed(2)}`,
    )
    .join('\n');

  const addr = data.shippingAddress;

  return `
¡Gracias por tu compra en ${brandName}!

Tu pedido #${data.orderNumber} ha sido recibido.

Resumen del pedido:
${itemsList}

Subtotal: S/. ${data.subtotal.toFixed(2)}
Envío: S/. ${data.shippingCost.toFixed(2)}
${data.discount > 0 ? `Descuento: -S/. ${data.discount.toFixed(2)}` : ''}
Total: S/. ${data.total.toFixed(2)}

Dirección de envío:
${addr.recipientName || ''}
${addr.street || ''} ${addr.number || ''}
${addr.district || ''}, ${addr.city || ''}
${addr.department || ''}

Te notificaremos cuando tu pedido sea enviado.

- El equipo de ${brandName}
  `.trim();
}

export function orderConfirmationEmailHtml(
  data: OrderConfirmationData,
): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="${inline.tableCell}">${item.productName}</td>
        <td style="${inline.tableCell} text-align: center;">${item.quantity}</td>
        <td style="${inline.tableCell} text-align: right;">S/. ${item.subtotal.toFixed(2)}</td>
      </tr>
    `,
    )
    .join('');

  const addr = data.shippingAddress;

  const content = `
    <h1 style="${inline.heading1}">¡Gracias por tu compra! 🛍️</h1>
    <p style="${inline.paragraph}">Tu pedido <strong>#${data.orderNumber}</strong> ha sido recibido y está siendo procesado.</p>
    
    <h2 style="${inline.heading2}">Resumen del pedido</h2>
    <table style="${inline.table}">
      <thead>
        <tr>
          <th style="${inline.tableHeader}">Producto</th>
          <th style="${inline.tableHeader} text-align: center;">Cantidad</th>
          <th style="${inline.tableHeader} text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div style="background-color: ${colors.background}; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 4px 0; color: ${colors.textSecondary};">Subtotal:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">S/. ${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: ${colors.textSecondary};">Envío:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">S/. ${data.shippingCost.toFixed(2)}</td>
        </tr>
        ${
          data.discount > 0
            ? `
        <tr>
          <td style="padding: 4px 0; color: ${colors.success};">Descuento:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: ${colors.success};">-S/. ${data.discount.toFixed(2)}</td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: 700; color: ${colors.text}; border-top: 2px solid ${colors.border};">Total:</td>
          <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: ${colors.primary}; border-top: 2px solid ${colors.border};">S/. ${data.total.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <h2 style="${inline.heading2}">Dirección de envío</h2>
    <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px;">
      <p style="margin: 0; color: ${colors.text};">
        <strong>${addr.recipientName || ''}</strong><br>
        ${addr.street || ''} ${addr.number || ''}<br>
        ${addr.district || ''}, ${addr.city || ''}<br>
        ${addr.department || ''}
      </p>
    </div>
    
    <p style="${inline.paragraph}; margin-top: 24px;">📦 Te notificaremos cuando tu pedido sea enviado.</p>
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderConfirmationEmailSubject(orderNumber: string): string {
  return `✓ Pedido #${orderNumber} confirmado - ${brandName}`;
}
