import { wrapInHtmlTemplate, emailFooter, inline, colors, brandName } from './base.template';

export interface OrderCancelledData {
  orderNumber: string;
}

export function orderCancelledEmailText(data: OrderCancelledData): string {
  return `
Pedido cancelado

El pedido #${data.orderNumber} ha sido cancelado.

Si realizaste un pago, el reembolso será procesado en los próximos días hábiles.

Si tienes alguna pregunta, no dudes en contactarnos.

- El equipo de ${brandName}
  `.trim();
}

export function orderCancelledEmailHtml(data: OrderCancelledData): string {
  const content = `
    <h1 style="${inline.heading1}">Pedido cancelado</h1>
    <p style="${inline.paragraph}">El pedido <strong>#${data.orderNumber}</strong> ha sido cancelado.</p>
    
    <div style="background-color: ${colors.errorLight}; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0; color: ${colors.errorText};">💰 Si realizaste un pago, el reembolso será procesado en los próximos días hábiles.</p>
    </div>
    
    <p style="${inline.paragraph}">Si tienes alguna pregunta, no dudes en contactarnos.</p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderCancelledEmailSubject(orderNumber: string): string {
  return `Pedido #${orderNumber} cancelado`;
}
