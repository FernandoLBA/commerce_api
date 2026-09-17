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
Hello ${data.firstName}!

We received a request to reset your password on ${brandName}.

To reset your password, click the following link:
${data.resetUrl}

This link will expire in 1 hour.

If you did not request this change, you can ignore this email. Your account is safe.

- The ${brandName} team
  `.trim();
}

export function passwordResetEmailHtml(data: PasswordResetEmailData): string {
  const content = `
    <h1 style="${inline.heading1}">Reset password 🔐</h1>
    <p style="${inline.paragraph}">Hello <strong>${data.firstName}</strong>,</p>
    <p style="${inline.paragraph}">We received a request to reset your password.</p>
    <div style="text-align: center; margin: 32px 0;">
      ${primaryButton('Reset my password', data.resetUrl)}
    </div>
    <p style="font-size: 14px; color: ${colors.textMuted};">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; word-break: break-all;"><a href="${data.resetUrl}" style="color: ${colors.primary};">${data.resetUrl}</a></p>
    <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px; margin-top: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${colors.textSecondary};">⏰ <strong>This link will expire in 1 hour.</strong></p>
    </div>
    ${emailFooter('If you did not request this change, you can ignore this email. Your account is safe.')}
  `;
  return wrapInHtmlTemplate(content);
}

export const passwordResetEmailSubject = `${brandName} - Reset password`;
