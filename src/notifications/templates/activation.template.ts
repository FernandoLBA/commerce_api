import {
  wrapInHtmlTemplate,
  primaryButton,
  emailFooter,
  inline,
  colors,
  brandName,
} from './base.template';

export interface ActivationEmailData {
  firstName: string;
  activationUrl: string;
}

export function activationEmailText(data: ActivationEmailData): string {
  return `
Hello ${data.firstName}!

Thank you for signing up at ${brandName}.

To activate your account, click the following link:
${data.activationUrl}

This link will expire in 24 hours.

If you did not create this account, you can ignore this email.

Thank you!
- The ${brandName} team
  `.trim();
}

export function activationEmailHtml(data: ActivationEmailData): string {
  const content = `
    <h1 style="${inline.heading1}">Welcome to ${brandName}! 🎉</h1>
    <p style="${inline.paragraph}">Hello <strong>${data.firstName}</strong>,</p>
    <p style="${inline.paragraph}">Thank you for signing up. You're one step away from enjoying the best deals.</p>
    <p style="${inline.paragraph}">To activate your account, click the button below:</p>
    <div style="text-align: center; margin: 32px 0;">
      ${primaryButton('Activate my account', data.activationUrl)}
    </div>
    <p style="font-size: 14px; color: ${colors.textMuted};">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; word-break: break-all;"><a href="${data.activationUrl}" style="color: ${colors.primary};">${data.activationUrl}</a></p>
    <div style="background-color: ${colors.background}; padding: 16px; border-radius: 8px; margin-top: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${colors.textSecondary};">⏰ <strong>This link will expire in 24 hours.</strong></p>
    </div>
    ${emailFooter('If you did not create this account, you can ignore this email.')}
  `;
  return wrapInHtmlTemplate(content);
}

export const activationEmailSubject = `Welcome to ${brandName}! Activate your account`;
