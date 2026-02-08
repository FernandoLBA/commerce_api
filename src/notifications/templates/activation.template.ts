import { wrapInHtmlTemplate, primaryButton, emailFooter } from './base.template';

export interface ActivationEmailData {
  firstName: string;
  activationUrl: string;
}

export function activationEmailText(data: ActivationEmailData): string {
  return `
¡Hola ${data.firstName}!

Gracias por registrarte en nuestra tienda.

Para activar tu cuenta, haz clic en el siguiente enlace:
${data.activationUrl}

Este enlace expirará en 24 horas.

Si no creaste esta cuenta, puedes ignorar este correo.

¡Gracias!
  `.trim();
}

export function activationEmailHtml(data: ActivationEmailData): string {
  const content = `
    <h1>¡Hola ${data.firstName}!</h1>
    <p>Gracias por registrarte en nuestra tienda.</p>
    <p>Para activar tu cuenta, haz clic en el siguiente botón:</p>
    ${primaryButton('Activar mi cuenta', data.activationUrl)}
    <p>O copia y pega este enlace en tu navegador:</p>
    <p><a href="${data.activationUrl}">${data.activationUrl}</a></p>
    <p><strong>Este enlace expirará en 24 horas.</strong></p>
    ${emailFooter('Si no creaste esta cuenta, puedes ignorar este correo.')}
  `;
  return wrapInHtmlTemplate(content);
}

export const activationEmailSubject = 'Activa tu cuenta';
