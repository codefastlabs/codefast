/**
 * @codefast/theme
 *
 * Theme management with React 19 features - optimistic updates, cross-tab sync, and SSR support.
 *
 * @example
 * ```tsx
 * // In __root.tsx (TanStack Start)
 * import { ThemeProvider, ThemeScript, resolveTheme } from '@codefast/theme';
 * import { getThemeServerFn, setThemeServerFn } from '@codefast/theme/tanstack-start';
 *
 * // In components
 * import { useTheme, themes, type Theme } from '@codefast/theme';
 * ```
 */

// Types & Schema
export type { Theme, ResolvedTheme, ThemeContextType } from '@/types';
export { themeSchema, themes } from '@/types';

// Constants
export { DEFAULT_THEME, DEFAULT_RESOLVED_THEME, THEME_STORAGE_KEY } from '@/constants';

// Core (Provider, Context, Hook)
export { ThemeContext, ThemeProvider, useTheme } from '@/core';

// Script (FOUC prevention)
export { ThemeScript } from '@/script';

// Utilities
export { applyTheme, disableAnimation, getSystemTheme, resolveTheme } from '@/utils';
