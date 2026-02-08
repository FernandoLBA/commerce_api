/**
 * Base HTML wrapper for email templates
 */
export function wrapInHtmlTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    ${content}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Primary button style for emails
 */
export function primaryButton(text: string, url: string): string {
  return `<a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #204DC6; color: #FFFFFF !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">${text}</a>`;
}

/**
 * Footer section for emails
 */
export function emailFooter(message?: string): string {
  return `
    <div style="margin-top: 30px; font-size: 12px; color: #5b5757; border-top: 1px solid #eee; padding-top: 20px;">
      ${message ? `<p>${message}</p>` : ''}
      <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
    </div>
  `;
}
