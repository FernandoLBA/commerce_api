import {
  wrapInHtmlTemplate,
  primaryButton,
  emailFooter,
  inline,
  colors,
  brandName,
} from './base.template';

export interface PasswordResetEmailData {
  firstName: string;
  resetUrl: string;
}

export function passwordResetEmailText(data: PasswordResetEmailData): string {
  return `
¡Hola ${data.firstName}!

Recibimos una solicitud para restablecer tu contraseña en ${brandName}.

Para restablecer tu contraseña, haz clic en el siguiente enlace:
${data.resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este correo. Tu cuenta está segura.

- El equipo de ${brandName}
  `.trim();
}

export function passwordResetEmailHtml(data: PasswordResetEmailData): string {
  const content = `
    <h1 style="${inline.heading1}">Restablecer contraseña 🔐</h1>
    <p style="${inline.paragraph}">Hola <strong>${data.firstName}</strong>,</p>
    <p style="${inline.paragraph}">Recibimos una solicitud para restablecer tu contraseña.</p>
    <div style="text-align: center; margin: 32px 0;">
      ${primaryButton('Restablecer mi contraseña', data.resetUrl)}
    </div>
    <p style="font-size: 14px; color: ${colors.textMuted};">O copia y pega este enlace en tu navegador:</p>
    <p style="font-size: 14px; word-break: break-all;"><a href="${data.resetUrl}" style="color: ${colors.primary};">${data.resetUrl}</a></p>
    <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px; margin-top: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${colors.textSecondary};">⏰ <strong>Este enlace expirará en 1 hora.</strong></p>
    </div>
    ${emailFooter('Si no solicitaste este cambio, puedes ignorar este correo. Tu cuenta está segura.')}
  `;
  return wrapInHtmlTemplate(content);
}

export const passwordResetEmailSubject = `${brandName} - Restablecer contraseña`;
