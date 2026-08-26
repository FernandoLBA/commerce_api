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
¡Tu pedido ha sido entregado!

El pedido #${data.orderNumber} ha sido entregado exitosamente.

Esperamos que disfrutes tu compra. Si tienes algún problema o pregunta, no dudes en contactarnos.

¡Gracias por comprar en ${brandName}!
  `.trim();
}

export function orderDeliveredEmailHtml(data: OrderDeliveredData): string {
  const content = `
    <h1 style="${inline.heading1}">¡Pedido entregado! 📦✅</h1>
    <p style="${inline.paragraph}">El pedido <strong>#${data.orderNumber}</strong> ha sido entregado exitosamente.</p>
    
    <div style="background-color: ${colors.successLight}; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 12px 0;">🎉</p>
      ${successBadge('Entrega completada')}
    </div>
    
    <p style="${inline.paragraph}">Esperamos que disfrutes tu compra. Si tienes algún problema o pregunta, no dudes en contactarnos.</p>
    <p style="${inline.paragraph}">¿Te gustó tu experiencia? <a href="#" style="color: ${colors.primary};">Déjanos una reseña</a></p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderDeliveredEmailSubject(orderNumber: string): string {
  return `¡Pedido #${orderNumber} entregado! 🎉`;
}
