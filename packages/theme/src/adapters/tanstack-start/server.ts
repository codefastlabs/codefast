import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import type { Theme } from '@/types';
import { themeSchema } from '@/types';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/constants';

/* -----------------------------------------------------------------------------
 * Server Functions
 *
 * These functions run on the server and handle cookie-based theme persistence.
 * Cookies are httpOnly for security - the client cannot read them directly.
 * -------------------------------------------------------------------------- */

/**
 * Read the user's theme preference from cookies.
 *
 * Validates the cookie value using Zod schema for type safety.
 * Returns {@link DEFAULT_THEME} if cookie is missing or invalid.
 *
 * @returns User's stored theme preference or default
 *
 * @example
 * ```tsx
 * const theme = await getThemeServerFn();
 * ```
 */
export const getThemeServerFn = createServerFn().handler((): Theme => {
  const cookieTheme = getCookie(THEME_STORAGE_KEY);
  const validationResult = themeSchema.safeParse(cookieTheme);

  if (validationResult.success) {
    return validationResult.data;
  }

  return DEFAULT_THEME;
});

/**
 * Persist theme preference to an HTTP-only cookie.
 *
 * **Security:**
 * - `httpOnly: true` - Cookie cannot be accessed from JavaScript (XSS protection)
 * - `secure: true` in production - Cookie only sent over HTTPS
 * - `sameSite: 'lax'` - Prevents CSRF while allowing navigation
 *
 * **Cookie Settings:**
 * - `maxAge: 1 year` - Preference persists across sessions
 * - `path: '/'` - Available to all routes
 *
 * @param data - Theme to persist ('light', 'dark', or 'system')
 *
 * @see {@link https://tanstack.com/start/latest/docs/framework/react/server-functions TanStack Start Server Functions}
 */
export const setThemeServerFn = createServerFn({ method: 'POST' })
  .inputValidator(themeSchema)
  .handler(({ data }: { data: Theme }): void => {
    setCookie(THEME_STORAGE_KEY, data, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  });

/**
 * Create a `persistTheme` function for {@link ThemeProvider}.
 *
 * Convenience wrapper that adapts `setThemeServerFn` to the signature
 * expected by ThemeProvider's `persistTheme` prop.
 *
 * @returns Async function compatible with ThemeProvider's persistTheme prop
 *
 * @example
 * ```tsx
 * <ThemeProvider persistTheme={(value) => setThemeServerFn({ data: value })}>
 * ```
 */
export function createPersistTheme(): (value: Theme) => Promise<void> {
  return async (value: Theme): Promise<void> => {
    await setThemeServerFn({ data: value });
  };
}
