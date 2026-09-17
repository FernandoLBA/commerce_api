import {
  wrapInHtmlTemplate,
  emailFooter,
  successBadge,
  inline,
  colors,
  brandName,
} from './base.template';

export interface OrderDeliveredData {
  orderNumber: string;
}

export function orderDeliveredEmailText(data: OrderDeliveredData): string {
  return `
Your order has been delivered!

Order #${data.orderNumber} has been delivered successfully.

We hope you enjoy your purchase. If you have any problems or questions, feel free to contact us.

Thank you for shopping at ${brandName}!
  `.trim();
}

export function orderDeliveredEmailHtml(data: OrderDeliveredData): string {
  const content = `
    <h1 style="${inline.heading1}">Order delivered! 📦✅</h1>
    <p style="${inline.paragraph}">Order <strong>#${data.orderNumber}</strong> has been delivered successfully.</p>

    <div style="background-color: ${colors.successLight}; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 12px 0;">🎉</p>
      ${successBadge('Delivery completed')}
    </div>

    <p style="${inline.paragraph}">We hope you enjoy your purchase. If you have any problems or questions, feel free to contact us.</p>
    <p style="${inline.paragraph}">Did you like your experience? <a href="#" style="color: ${colors.primary};">Leave us a review</a></p>

    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderDeliveredEmailSubject(orderNumber: string): string {
  return `Order #${orderNumber} delivered! 🎉`;
}
