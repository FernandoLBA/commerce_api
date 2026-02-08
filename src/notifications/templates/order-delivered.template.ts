import { wrapInHtmlTemplate, emailFooter } from './base.template';

export interface OrderDeliveredData {
  orderNumber: string;
}

export function orderDeliveredEmailText(data: OrderDeliveredData): string {
  return `
¡Tu pedido ha sido entregado!

El pedido #${data.orderNumber} ha sido entregado exitosamente.

Esperamos que disfrutes tu compra. Si tienes algún problema o pregunta, no dudes en contactarnos.

¡Gracias por comprar con nosotros!
  `.trim();
}

export function orderDeliveredEmailHtml(data: OrderDeliveredData): string {
  const content = `
    <h1>¡Tu pedido ha sido entregado!</h1>
    <p>El pedido <strong>#${data.orderNumber}</strong> ha sido entregado exitosamente.</p>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="font-size: 48px; margin: 0;">✅</p>
      <p style="font-weight: bold; color: #155724;">Entrega completada</p>
    </div>
    
    <p>Esperamos que disfrutes tu compra. Si tienes algún problema o pregunta, no dudes en contactarnos.</p>
    
    ${emailFooter()}
  `;
  return wrapInHtmlTemplate(content);
}

export function orderDeliveredEmailSubject(orderNumber: string): string {
  return `Tu pedido #${orderNumber} ha sido entregado`;
}
