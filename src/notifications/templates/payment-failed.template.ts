import {
  wrapInHtmlTemplate,
  emailFooter,
  errorBadge,
  inline,
  colors,
  brandName,
} from './base.template';

export interface PaymentFailedData {
  orderNumber: string;
  reason?: string;
}

export function paymentFailedEmailText(data: PaymentFailedData): string {
  return `
Problem with your payment

We could not process the payment for order #${data.orderNumber}.
${data.reason ? `\nReason: ${data.reason}` : ''}

Please try again with another payment method or contact your bank.

If you need help, feel free to contact us.

- The ${brandName} team
  `.trim();
}

export function paymentFailedEmailHtml(data: PaymentFailedData): string {
  const content = `
    <h1 style="${inline.heading1}">Problem with your payment ⚠️</h1>

    <div style="background-color: ${colors.errorLight}; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      ${errorBadge('Payment not processed')}
      <p style="margin: 16px 0 0 0; color: ${colors.errorText};">Order <strong>#${data.orderNumber}</strong></p>
      ${data.reason ? `<p style="margin: 8px 0 0 0; color: ${colors.errorText};"><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>

    <p style="${inline.paragraph}">Please try again with another payment method or contact your bank.</p>
    <p style="${inline.paragraph}">If you need help, feel free to contact us.</p>

    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function paymentFailedEmailSubject(orderNumber: string): string {
  return `⚠️ Payment issue - Order #${orderNumber}`;
}
