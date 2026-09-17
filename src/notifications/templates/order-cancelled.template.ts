import {
  wrapInHtmlTemplate,
  emailFooter,
  inline,
  colors,
  brandName,
} from './base.template';

export interface OrderCancelledData {
  orderNumber: string;
}

export function orderCancelledEmailText(data: OrderCancelledData): string {
  return `
Order cancelled

Order #${data.orderNumber} has been cancelled.

If you made a payment, the refund will be processed within the next business days.

If you have any questions, feel free to contact us.

- The ${brandName} team
  `.trim();
}

export function orderCancelledEmailHtml(data: OrderCancelledData): string {
  const content = `
    <h1 style="${inline.heading1}">Order cancelled</h1>
    <p style="${inline.paragraph}">Order <strong>#${data.orderNumber}</strong> has been cancelled.</p>

    <div style="background-color: ${colors.errorLight}; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0; color: ${colors.errorText};">💰 If you made a payment, the refund will be processed within the next business days.</p>
    </div>

    <p style="${inline.paragraph}">If you have any questions, feel free to contact us.</p>

    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderCancelledEmailSubject(orderNumber: string): string {
  return `Order #${orderNumber} cancelled`;
}
