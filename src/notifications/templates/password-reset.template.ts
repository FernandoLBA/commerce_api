import { wrapInHtmlTemplate, primaryButton, emailFooter } from './base.template';

export interface PasswordResetEmailData {
  firstName: string;
  resetUrl: string;
}

export function passwordResetEmailText(data: PasswordResetEmailData): string {
  return `
¡Hola ${data.firstName}!

Recibimos una solicitud para restablecer tu contraseña.

Para restablecer tu contraseña, haz clic en el siguiente enlace:
${data.resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este correo.

¡Gracias!
  `.trim();
}

export function passwordResetEmailHtml(data: PasswordResetEmailData): string {
  const content = `
    <h1>¡Hola ${data.firstName}!</h1>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
    ${primaryButton('Restablecer mi contraseña', data.resetUrl)}
    <p>O copia y pega este enlace en tu navegador:</p>
    <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
    <p><strong>Este enlace expirará en 1 hora.</strong></p>
    ${emailFooter('Si no solicitaste este cambio, puedes ignorar este correo.')}
  `;
  return wrapInHtmlTemplate(content);
}

export const passwordResetEmailSubject = 'Restablece tu contraseña';
