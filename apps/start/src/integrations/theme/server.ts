import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

/**
 * Zod validator for theme values.
 *
 * Ensures that theme values are strictly one of the allowed literal values:
 * 'light' or 'dark'. This validator is used to validate both input and
 * output of theme-related server functions.
 */
const themeValidator = z.union([z.literal('light'), z.literal('dark')]);

/**
 * Type representing the available theme options.
 *
 * This type is inferred from the themeValidator schema, ensuring type safety
 * across the application. Only 'light' and 'dark' are valid theme values.
 */
export type Theme = z.infer<typeof themeValidator>;

/**
 * Cookie storage key for persisting user's theme preference.
 *
 * This key is used to store and retrieve the user's preferred theme from
 * HTTP cookies, allowing the theme preference to persist across page reloads
 * and browser sessions.
 */
const storageKey = '_preferred-theme';

/**
 * Default theme applied when no user preference is found.
 *
 * When a user visits the application for the first time or when no theme
 * preference is stored in cookies, this default theme will be used.
 */
export const DEFAULT_THEME: Theme = 'dark';

/**
 * Server function to retrieve the current theme preference.
 *
 * This function reads the theme preference from HTTP cookies. If no cookie
 * is found or the cookie value is invalid, it returns the default theme.
 * The function is executed on the server side during route loading, ensuring
 * the correct theme is applied before the page is rendered.
 *
 * @returns The current theme preference from cookies, or the default
 *          theme if no preference is found.
 *
 * @example
 * ```tsx
 * // In a route loader
 * export const Route = createRootRoute({
 *   loader: () => getThemeServerFn(),
 * });
 *
 * // Usage in component
 * function RootComponent() {
 *   const theme = Route.useLoaderData();
 *   return <html className={theme}>...</html>;
 * }
 * ```
 */
export const getThemeServerFn = createServerFn().handler(() => {
  const cookieTheme = getCookie(storageKey);
  return (cookieTheme || DEFAULT_THEME) as Theme;
});

/**
 * Server function to persist the user's theme preference.
 *
 * This function saves the theme preference to HTTP cookies, allowing the
 * preference to persist across page reloads and browser sessions. The function
 * validates the input using Zod to ensure only valid theme values ('light' or
 * 'dark') are accepted.
 *
 * After setting the cookie, the router is typically invalidated to trigger
 * a re-render with the new theme applied. This ensures server-side rendering
 * consistency with the client-side state.
 *
 * @param options - The options object containing:
 *   - `data`: The theme value to persist. Must be either 'light' or 'dark'.
 *
 * @returns A promise that resolves when the cookie has been set successfully.
 *
 * @throws ZodError If the provided theme value is not 'light' or 'dark'.
 *
 * @example
 * ```tsx
 * // In a component
 * async function handleThemeChange(newTheme: Theme) {
 *   await setThemeServerFn({ data: newTheme });
 *   router.invalidate();
 * }
 * ```
 */
export const setThemeServerFn = createServerFn({ method: 'POST' })
  .inputValidator(themeValidator)
  .handler(({ data }) => {
    setCookie(storageKey, data);
  });
