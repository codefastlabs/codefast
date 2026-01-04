/**
 * TanStack Start Adapter
 *
 * Provides server functions for theme persistence with TanStack Start.
 *
 * @example
 * ```tsx
 * import { getThemeServerFn, setThemeServerFn } from '@codefast/theme/tanstack-start';
 *
 * // In loaderFn
 * const theme = await getThemeServerFn();
 *
 * // In ThemeProvider
 * <ThemeProvider theme={theme} persistTheme={(v) => setThemeServerFn({ data: v })}>
 * ```
 */

export { getThemeServerFn, setThemeServerFn, createPersistTheme } from '@/adapters/tanstack-start/server';
