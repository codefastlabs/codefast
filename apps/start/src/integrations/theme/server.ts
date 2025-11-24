import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

/**
 * Theme preference that can be stored in cookie.
 * Supports 'light' or 'dark'.
 */
const themeValidator = z.union([z.literal('light'), z.literal('dark')]);
export type Theme = z.infer<typeof themeValidator>;

/**
 * The cookie key used to store the theme preference.
 */
const storageKey = '_preferred-theme';

/**
 * Default theme when no preference is stored.
 */
export const DEFAULT_THEME: Theme = 'light';

/**
 * Server function to retrieve the current theme from the cookie.
 *
 * This function runs on the server and reads the theme preference from cookies.
 * If no cookie exists, it returns the default theme ('light').
 *
 * @returns The current theme preference from cookie, or default theme if not found.
 */
export const getThemeServerFn = createServerFn().handler(() => {
  const cookieTheme = getCookie(storageKey);
  return (cookieTheme || DEFAULT_THEME) as Theme;
});

/**
 * Server function to update the theme preference in the cookie.
 *
 * This function runs on the server and persists the theme preference to cookies.
 * The theme will be available during SSR on subsequent requests.
 *
 * @param data - The theme value to store ('light' or 'dark').
 */
export const setThemeServerFn = createServerFn({ method: 'POST' })
  .inputValidator(themeValidator)
  .handler(({ data }) => {
    setCookie(storageKey, data);
  });
