import { wrapInHtmlTemplate, emailFooter, errorBadge, inline, colors, brandName } from './base.template';

export interface PaymentFailedData {
  orderNumber: string;
  reason?: string;
}

export function paymentFailedEmailText(data: PaymentFailedData): string {
  return `
Problema con tu pago

No pudimos procesar el pago para el pedido #${data.orderNumber}.
${data.reason ? `\nMotivo: ${data.reason}` : ''}

Por favor, intenta nuevamente con otro método de pago o contacta con tu banco.

Si necesitas ayuda, no dudes en contactarnos.

- El equipo de ${brandName}
  `.trim();
}

export function paymentFailedEmailHtml(data: PaymentFailedData): string {
  const content = `
    <h1 style="${inline.heading1}">Problema con tu pago ⚠️</h1>
    
    <div style="background-color: ${colors.errorLight}; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      ${errorBadge('Pago no procesado')}
      <p style="margin: 16px 0 0 0; color: ${colors.errorText};">Pedido <strong>#${data.orderNumber}</strong></p>
      ${data.reason ? `<p style="margin: 8px 0 0 0; color: ${colors.errorText};"><strong>Motivo:</strong> ${data.reason}</p>` : ''}
    </div>
    
    <p style="${inline.paragraph}">Por favor, intenta nuevamente con otro método de pago o contacta con tu banco.</p>
    <p style="${inline.paragraph}">Si necesitas ayuda, no dudes en contactarnos.</p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function paymentFailedEmailSubject(orderNumber: string): string {
  return `⚠️ Problema con el pago - Pedido #${orderNumber}`;
}
