import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

/* -----------------------------------------------------------------------------
 * Types & Constants
 * -------------------------------------------------------------------------- */

const themeValidator = z.union([z.literal('light'), z.literal('dark'), z.literal('system')]);

export type Theme = z.infer<typeof themeValidator>;

const storageKey = 'ui-theme';

export const DEFAULT_THEME: Theme = 'system';

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
  const cookieTheme = getCookie(storageKey);

  // Validate cookie value using Zod to ensure type safety
  const validationResult = themeValidator.safeParse(cookieTheme);

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
  .inputValidator(themeValidator)
  .handler(({ data }: { data: Theme }): void => {
    setCookie(storageKey, data, {
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
