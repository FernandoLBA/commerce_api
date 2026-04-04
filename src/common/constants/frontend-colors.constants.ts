/**
 * Frontend color palette - Spoom E-commerce
 * Based on Amber/Mostaza theme from globals.css
 * Font: Inter (system-ui fallback)
 */
export const FRONTEND_COLORS = {
  // Primary colors - Mostaza/Naranja (Amber)
  primary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main primary
    600: '#d97706', // Hover/Active
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Neutral colors
  neutral: {
    white: '#ffffff',
    black: '#000000',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#047857',
    text: '#065f46',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
    text: '#991b1b',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
    text: '#92400e',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
    text: '#1e40af',
  },
} as const;

/**
 * Email template styles - Inline styles for email compatibility
 * Gmail and other clients strip <style> tags, so use inline styles
 */
export const EMAIL_STYLES = {
  // Brand
  brandName: 'StratoGO!',

  // Colors for email templates
  colors: {
    primary: FRONTEND_COLORS.primary[500],
    primaryHover: FRONTEND_COLORS.primary[600],
    primaryDark: FRONTEND_COLORS.primary[700],
    background: FRONTEND_COLORS.neutral[50],
    surface: FRONTEND_COLORS.neutral.white,
    text: FRONTEND_COLORS.neutral[800],
    textSecondary: FRONTEND_COLORS.neutral[600],
    textMuted: FRONTEND_COLORS.neutral[500],
    border: FRONTEND_COLORS.neutral[200],
    success: FRONTEND_COLORS.success.main,
    successLight: FRONTEND_COLORS.success.light,
    successText: FRONTEND_COLORS.success.text,
    error: FRONTEND_COLORS.error.main,
    errorLight: FRONTEND_COLORS.error.light,
    errorText: FRONTEND_COLORS.error.text,
  },

  // Typography
  fonts: {
    primary: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },

  // Common inline styles
  inline: {
    body: `font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #262626; background-color: #fafafa; margin: 0; padding: 0;`,
    container: `max-width: 600px; margin: 0 auto; padding: 40px 20px;`,
    card: `background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);`,
    heading1: `font-size: 28px; font-weight: 700; color: #171717; margin: 0 0 16px 0;`,
    heading2: `font-size: 20px; font-weight: 600; color: #262626; margin: 0 0 12px 0;`,
    paragraph: `font-size: 16px; color: #525252; margin: 0 0 16px 0; line-height: 1.6;`,
    buttonPrimary: `display: inline-block; padding: 14px 28px; background-color: #f59e0b; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;`,
    buttonSecondary: `display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #f59e0b !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 2px solid #f59e0b;`,
    link: `color: #f59e0b; text-decoration: underline;`,
    footer: `margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #737373; text-align: center;`,
    badge: `display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;`,
    badgeSuccess: `background-color: #d1fae5; color: #065f46;`,
    badgeError: `background-color: #fee2e2; color: #991b1b;`,
    badgeWarning: `background-color: #fef3c7; color: #92400e;`,
    table: `width: 100%; border-collapse: collapse; margin: 16px 0;`,
    tableHeader: `background-color: #fafafa; padding: 12px; text-align: left; font-weight: 600; color: #262626; border-bottom: 2px solid #e5e5e5;`,
    tableCell: `padding: 12px; border-bottom: 1px solid #e5e5e5; color: #525252;`,
  },
} as const;

export type FrontendColors = typeof FRONTEND_COLORS;
export type EmailStyles = typeof EMAIL_STYLES;