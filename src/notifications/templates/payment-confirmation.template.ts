import { wrapInHtmlTemplate, emailFooter, successBadge, inline, colors, brandName } from './base.template';

export interface PaymentConfirmationData {
  orderNumber: string;
  amount: number;
}

export function paymentConfirmationEmailText(data: PaymentConfirmationData): string {
  return `
¡Pago recibido!

Hemos recibido tu pago de S/. ${data.amount.toFixed(2)} para el pedido #${data.orderNumber}.

Tu pedido será procesado y enviado pronto.

¡Gracias por comprar en ${brandName}!
  `.trim();
}

export function paymentConfirmationEmailHtml(data: PaymentConfirmationData): string {
  const content = `
    <h1 style="${inline.heading1}">¡Pago recibido! 💳</h1>
    
    <div style="background-color: ${colors.successLight}; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <p style="font-size: 32px; font-weight: 700; color: ${colors.successText}; margin: 0 0 8px 0;">S/. ${data.amount.toFixed(2)}</p>
      ${successBadge('Pago confirmado')}
    </div>
    
    <p style="${inline.paragraph}">Hemos recibido tu pago para el pedido <strong>#${data.orderNumber}</strong>.</p>
    <p style="${inline.paragraph}">Tu pedido será procesado y enviado pronto.</p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function paymentConfirmationEmailSubject(orderNumber: string): string {
  return `✓ Pago confirmado - Pedido #${orderNumber}`;
}
