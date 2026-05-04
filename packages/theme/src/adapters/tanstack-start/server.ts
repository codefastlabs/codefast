import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";

import type { ResolvedTheme, Theme } from "#/types";
import { themeSchema } from "#/types";

import { DEFAULT_RESOLVED_THEME, DEFAULT_THEME, THEME_STORAGE_KEY } from "#/constants";

/* -----------------------------------------------------------------------------
 * Request helpers (one round-trip when composed)
 * -------------------------------------------------------------------------- */

function readThemeFromCookie(): Theme {
  const cookieTheme = getCookie(THEME_STORAGE_KEY);
  const validationResult = themeSchema.safeParse(cookieTheme);

  if (validationResult.success) {
    return validationResult.data;
  }

  return DEFAULT_THEME;
}

function readSsrSystemThemeFromHeaders(): ResolvedTheme {
  const hint =
    getRequestHeader("Sec-CH-Prefers-Color-Scheme") ?? getRequestHeader("Prefers-Color-Scheme");

  if (hint === "dark") {
    return "dark";
  }

  if (hint === "light") {
    return "light";
  }

  return DEFAULT_RESOLVED_THEME;
}

/**
 * Data shape returned from {@link getRootThemeServerFn} for the root route loader.
 *
 * @since 0.3.16-canary.0
 */
export interface RootThemeLoaderData {
  /**
   * Resolved `light` or `dark` from the incoming request when detectable
   * (e.g. `Sec-CH-Prefers-Color-Scheme`). Pass to `ThemeProvider` as `ssrSystemTheme` and to
   * `resolveTheme(theme, ssrSystemTheme)` on `<html>`. When the hint is absent, matches
   * {@link DEFAULT_RESOLVED_THEME}.
   */
  ssrSystemTheme: ResolvedTheme;
  /**
   * User preference from the httpOnly cookie: `light`, `dark`, or `system`.
   */
  theme: Theme;
}

/* -----------------------------------------------------------------------------
 * Server Functions
 *
 * These functions run on the server and handle cookie-based theme persistence.
 * Cookies are httpOnly for security - the client cannot read them directly.
 * -------------------------------------------------------------------------- */

/**
 * Everything needed for the root shell in **one** server call (fewer loader awaits).
 *
 * In your shell: `resolveTheme(theme, ssrSystemTheme)` on `<html>`, plus `ThemeScript` and `ThemeProvider`.
 *
 * @since 0.3.16-canary.0
 */
export const getRootThemeServerFn = createServerFn().handler(
  (): RootThemeLoaderData => ({
    theme: readThemeFromCookie(),
    ssrSystemTheme: readSsrSystemThemeFromHeaders(),
  }),
);

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
 *
 * @since 0.3.16-canary.0
 */
export const getThemeServerFn = createServerFn().handler((): Theme => readThemeFromCookie());

/**
 * Resolved OS theme for SSR / hydration, from Client Hints when the browser sends them.
 *
 * Mirrors client `matchMedia("(prefers-color-scheme: dark)")` when hints are present.
 * Prefer {@link getRootThemeServerFn} for root loaders.
 *
 * Send `Accept-CH: Sec-CH-Prefers-Color-Scheme` (and `Vary`) so navigations include the hint.
 *
 * @since 0.3.16-canary.0
 */
export const getSsrSystemThemeServerFn = createServerFn().handler(
  (): ResolvedTheme => readSsrSystemThemeFromHeaders(),
);

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
 * @see [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/server-functions)
 *
 * @since 0.3.16-canary.0
 */
export const setThemeServerFn = createServerFn({ method: "POST" })
  .inputValidator(themeSchema)
  .handler(({ data }: { data: Theme }): void => {
    setCookie(THEME_STORAGE_KEY, data, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

/**
 * Default {@link ThemeProvider} `persistTheme` for the Start adapter: writes the httpOnly
 * theme cookie via {@link setThemeServerFn}.
 *
 * @since 0.3.16-canary.0
 */
export async function persistThemeCookie(value: Theme): Promise<void> {
  await setThemeServerFn({ data: value });
}
