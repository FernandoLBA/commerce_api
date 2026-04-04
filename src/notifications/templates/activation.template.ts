import { wrapInHtmlTemplate, primaryButton, emailFooter, inline, colors, brandName } from './base.template';

export interface ActivationEmailData {
  firstName: string;
  activationUrl: string;
}

export function activationEmailText(data: ActivationEmailData): string {
  return `
¡Hola ${data.firstName}!

Gracias por registrarte en ${brandName}.

Para activar tu cuenta, haz clic en el siguiente enlace:
${data.activationUrl}

Este enlace expirará en 24 horas.

Si no creaste esta cuenta, puedes ignorar este correo.

¡Gracias!
- El equipo de ${brandName}
  `.trim();
}

export function activationEmailHtml(data: ActivationEmailData): string {
  const content = `
    <h1 style="${inline.heading1}">¡Bienvenido a ${brandName}! 🎉</h1>
    <p style="${inline.paragraph}">Hola <strong>${data.firstName}</strong>,</p>
    <p style="${inline.paragraph}">Gracias por registrarte. Estás a un paso de comenzar a disfrutar de las mejores ofertas.</p>
    <p style="${inline.paragraph}">Para activar tu cuenta, haz clic en el siguiente botón:</p>
    <div style="text-align: center; margin: 32px 0;">
      ${primaryButton('Activar mi cuenta', data.activationUrl)}
    </div>
    <p style="font-size: 14px; color: ${colors.textMuted};">O copia y pega este enlace en tu navegador:</p>
    <p style="font-size: 14px; word-break: break-all;"><a href="${data.activationUrl}" style="color: ${colors.primary};">${data.activationUrl}</a></p>
    <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px; margin-top: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${colors.textSecondary};">⏰ <strong>Este enlace expirará en 24 horas.</strong></p>
    </div>
    ${emailFooter('Si no creaste esta cuenta, puedes ignorar este correo.')}
  `;
  return wrapInHtmlTemplate(content);
}

export const activationEmailSubject = `¡Bienvenido a ${brandName}! Activa tu cuenta`;
