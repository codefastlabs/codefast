/**
 * Theme Integration
 *
 * Provides theme management with server-side persistence and client-side reactivity.
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * import { ThemeProvider, ThemeScript, getThemeServerFn } from '@/integrations/theme';
 *
 * // In components
 * import { useTheme, themes, type Theme } from '@/integrations/theme';
 * ```
 */

// Types & Constants
export type { Theme, ResolvedTheme } from '@/integrations/theme/types';
export { themes, themeSchema, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/integrations/theme/types';

// Provider & Script
export { ThemeProvider, ThemeScript, ThemeContext } from '@/integrations/theme/provider';
export type { ThemeContextType } from '@/integrations/theme/provider';

// Hook
export { useTheme } from '@/integrations/theme/use-theme';

// Server Functions
export { getThemeServerFn, setThemeServerFn } from '@/integrations/theme/server';
