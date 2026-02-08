import { wrapInHtmlTemplate, emailFooter } from './base.template';

export interface OrderCancelledData {
  orderNumber: string;
}

export function orderCancelledEmailText(data: OrderCancelledData): string {
  return `
Tu pedido ha sido cancelado

El pedido #${data.orderNumber} ha sido cancelado.

Si realizaste un pago, el reembolso será procesado en los próximos días hábiles.

Si tienes alguna pregunta, no dudes en contactarnos.
  `.trim();
}

export function orderCancelledEmailHtml(data: OrderCancelledData): string {
  const content = `
    <h1>Tu pedido ha sido cancelado</h1>
    <p>El pedido <strong>#${data.orderNumber}</strong> ha sido cancelado.</p>
    
    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #721c24;">Si realizaste un pago, el reembolso será procesado en los próximos días hábiles.</p>
    </div>
    
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderCancelledEmailSubject(orderNumber: string): string {
  return `Pedido cancelado #${orderNumber}`;
}
