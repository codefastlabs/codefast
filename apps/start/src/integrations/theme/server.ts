import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import type { Theme } from '@/integrations/theme/types';
import { DEFAULT_THEME, THEME_STORAGE_KEY, themeSchema } from '@/integrations/theme/types';

/* -----------------------------------------------------------------------------
 * Server Functions
 * -------------------------------------------------------------------------- */

/**
 * Get the current theme from cookies or return the default theme.
 *
 * Uses Zod validator to ensure type safety of the cookie value.
 *
 * @returns The current theme preference stored in cookies, or DEFAULT_THEME if not set or invalid.
 */
export const getThemeServerFn = createServerFn().handler((): Theme => {
  const cookieTheme = getCookie(THEME_STORAGE_KEY);

  // Validate cookie value using Zod to ensure type safety
  const validationResult = themeSchema.safeParse(cookieTheme);

  if (validationResult.success) {
    return validationResult.data;
  }

  return DEFAULT_THEME;
});

/**
 * Set the theme preference in cookies.
 *
 * Cookie is set with httpOnly=true to ensure only the server can read it,
 * preventing access from client-side JavaScript. Theme is passed to the
 * client through the server loader, so there's no need to read directly from the cookie.
 *
 * @param data - The theme to set ('light' or 'dark')
 * @throws Error If the theme value is invalid
 */
export const setThemeServerFn = createServerFn({ method: 'POST' })
  .inputValidator(themeSchema)
  .handler(({ data }: { data: Theme }): void => {
    setCookie(THEME_STORAGE_KEY, data, {
      // Set cookie to expire in 1 year
      maxAge: 60 * 60 * 24 * 365,
      // Make cookie available to all paths
      path: '/',
      // Use SameSite=Lax for better security while allowing navigation
      sameSite: 'lax',
      // Cookie can only be read by the server, not accessible from JavaScript
      // This provides better security and prevents XSS attacks
      httpOnly: true,
      // Only send cookie over HTTPS in production for security
      secure: process.env.NODE_ENV === 'production',
    });
  });
