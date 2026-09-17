import {
  wrapInHtmlTemplate,
  emailFooter,
  successBadge,
  inline,
  colors,
  brandName,
} from './base.template';

export interface PaymentConfirmationData {
  orderNumber: string;
  amount: number;
}

export function paymentConfirmationEmailText(
  data: PaymentConfirmationData,
): string {
  return `
Payment received!

We have received your payment of S/. ${data.amount.toFixed(2)} for order #${data.orderNumber}.

Your order will be processed and shipped soon.

Thank you for shopping at ${brandName}!
  `.trim();
}

export function paymentConfirmationEmailHtml(
  data: PaymentConfirmationData,
): string {
  const content = `
    <h1 style="${inline.heading1}">Payment received! 💳</h1>

    <div style="background-color: ${colors.successLight}; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <p style="font-size: 32px; font-weight: 700; color: ${colors.successText}; margin: 0 0 8px 0;">S/. ${data.amount.toFixed(2)}</p>
      ${successBadge('Payment confirmed')}
    </div>

    <p style="${inline.paragraph}">We have received your payment for order <strong>#${data.orderNumber}</strong>.</p>
    <p style="${inline.paragraph}">Your order will be processed and shipped soon.</p>

    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function paymentConfirmationEmailSubject(orderNumber: string): string {
  return `✓ Payment confirmed - Order #${orderNumber}`;
}
