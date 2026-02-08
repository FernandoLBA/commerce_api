import { wrapInHtmlTemplate, emailFooter } from './base.template';

export interface PaymentConfirmationData {
  orderNumber: string;
  amount: number;
}

export function paymentConfirmationEmailText(data: PaymentConfirmationData): string {
  return `
¡Pago recibido!

Hemos recibido tu pago de S/. ${data.amount} para el pedido #${data.orderNumber}.

Tu pedido será procesado y enviado pronto.

¡Gracias por tu compra!
  `.trim();
}

export function paymentConfirmationEmailHtml(data: PaymentConfirmationData): string {
  const content = `
    <h1>¡Pago recibido!</h1>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="font-size: 48px; margin: 0;">💳</p>
      <p style="font-size: 24px; font-weight: bold; color: #155724;">S/. ${data.amount}</p>
      <p style="color: #155724;">Pago confirmado</p>
    </div>
    
    <p>Hemos recibido tu pago para el pedido <strong>#${data.orderNumber}</strong>.</p>
    <p>Tu pedido será procesado y enviado pronto.</p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function paymentConfirmationEmailSubject(orderNumber: string): string {
  return `Pago confirmado - Pedido #${orderNumber}`;
}
