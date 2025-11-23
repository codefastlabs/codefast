/**
 * The theme value that can be applied to the application.
 *
 * Supports built-in themes ('light', 'dark', 'system') or custom theme strings.
 * When set to 'system', the theme will automatically follow the user's OS preference.
 *
 * @example
 * 'light' | 'dark' | 'system' | 'custom-theme-name'
 */
export type Theme = 'light' | 'dark' | 'system' | string;

/**
 * The resolved system theme preference from the user's OS.
 *
 * This represents the actual color scheme preference detected from the system,
 * which can only be 'light' or 'dark'.
 */
export type SystemTheme = 'light' | 'dark';
