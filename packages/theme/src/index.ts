/**
 * \@codefast/theme
 *
 * React 19 theme management library with SSR support, cross-tab synchronization,
 * and optimistic UI updates. Supports light, dark, and system theme preferences.
 *
 * @see {@link ThemeProvider} - Main provider component
 * @see {@link useTheme} - Hook for consuming theme context
 * @see {@link ThemeScript} - FOUC prevention script
 */

// Types & Schema
export type { ResolvedTheme, Theme, ThemeContextType } from '@/types';
export { themes, themeSchema } from '@/types';

// Constants
export { DEFAULT_RESOLVED_THEME, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/constants';

// Core (Provider, Context, Hook)
export { ThemeContext, ThemeProvider, useTheme } from '@/core';

// Script (FOUC prevention)
export { ThemeScript } from '@/script';

// Utilities
export { applyTheme, disableAnimation, getSystemTheme, resolveTheme } from '@/utils';
