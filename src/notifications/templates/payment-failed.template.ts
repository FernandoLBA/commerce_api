import { wrapInHtmlTemplate, emailFooter } from './base.template';

export interface PaymentFailedData {
  orderNumber: string;
  reason?: string;
}

export function paymentFailedEmailText(data: PaymentFailedData): string {
  return `
Hubo un problema con tu pago

No pudimos procesar el pago para el pedido #${data.orderNumber}.
${data.reason ? `\nMotivo: ${data.reason}` : ''}

Por favor, intenta nuevamente con otro método de pago o contacta con tu banco.

Si necesitas ayuda, no dudes en contactarnos.
  `.trim();
}

export function paymentFailedEmailHtml(data: PaymentFailedData): string {
  const content = `
    <h1>Hubo un problema con tu pago</h1>
    
    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 48px; margin: 0; text-align: center;">⚠️</p>
      <p style="color: #721c24;">No pudimos procesar el pago para el pedido <strong>#${data.orderNumber}</strong>.</p>
      ${data.reason ? `<p style="color: #721c24;"><strong>Motivo:</strong> ${data.reason}</p>` : ''}
    </div>
    
    <p>Por favor, intenta nuevamente con otro método de pago o contacta con tu banco.</p>
    <p>Si necesitas ayuda, no dudes en contactarnos.</p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function paymentFailedEmailSubject(orderNumber: string): string {
  return `Problema con el pago - Pedido #${orderNumber}`;
}
