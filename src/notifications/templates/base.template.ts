import { EMAIL_STYLES } from '../../common/constants/frontend-colors.constants';

const { inline, brandName, colors, fonts } = EMAIL_STYLES;

/**
 * Base HTML wrapper for email templates - Spoom branding
 */
export function wrapInHtmlTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${inline.body}">
  <div style="${inline.container}">
    <div style="${inline.card}">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 700; color: ${colors.primary};">${brandName}</span>
      </div>
      ${content}
    </div>
    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: ${colors.textMuted};">
      <p>© ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Primary button style for emails - Amber/Mostaza theme
 */
export function primaryButton(text: string, url: string): string {
  return `<a href="${url}" style="${inline.buttonPrimary}">${text}</a>`;
}

/**
 * Secondary button style for emails
 */
export function secondaryButton(text: string, url: string): string {
  return `<a href="${url}" style="${inline.buttonSecondary}">${text}</a>`;
}

/**
 * Footer section for emails
 */
export function emailFooter(message?: string): string {
  return `
    <div style="${inline.footer}">
      ${message ? `<p style="margin: 0 0 8px 0;">${message}</p>` : ''}
      <p style="margin: 0;">Este es un mensaje automático, por favor no respondas a este correo.</p>
    </div>
  `;
}

/**
 * Success badge
 */
export function successBadge(text: string): string {
  return `<span style="${inline.badge} ${inline.badgeSuccess}">${text}</span>`;
}

/**
 * Error badge
 */
export function errorBadge(text: string): string {
  return `<span style="${inline.badge} ${inline.badgeError}">${text}</span>`;
}

/**
 * Warning badge
 */
export function warningBadge(text: string): string {
  return `<span style="${inline.badge} ${inline.badgeWarning}">${text}</span>`;
}

// Re-export styles for use in other templates
export { EMAIL_STYLES, colors, inline, fonts, brandName };
