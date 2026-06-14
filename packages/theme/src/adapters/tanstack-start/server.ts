import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";

import { DEFAULT_RESOLVED_COLOR_SCHEME, DEFAULT_COLOR_SCHEME, STORAGE_KEY } from "#/constants";
import type { ResolvedColorScheme, ColorScheme } from "#/types";
import { colorSchemeSchema } from "#/types";

/* -----------------------------------------------------------------------------
 * Request helpers (one round-trip when composed)
 * -------------------------------------------------------------------------- */

function readColorSchemeFromCookie(): ColorScheme {
  const cookieValue = getCookie(STORAGE_KEY);
  const validationResult = colorSchemeSchema.safeParse(cookieValue);

  if (validationResult.success) {
    return validationResult.data;
  }

  return DEFAULT_COLOR_SCHEME;
}

function readSsrColorSchemeFromHeaders(): ResolvedColorScheme {
  const hint = getRequestHeader("Sec-CH-Prefers-Color-Scheme") ?? getRequestHeader("Prefers-Color-Scheme");

  if (hint === "dark") {
    return "dark";
  }

  if (hint === "light") {
    return "light";
  }

  return DEFAULT_RESOLVED_COLOR_SCHEME;
}

/**
 * Data shape returned from {@link getRootColorSchemeServerFn} for the root route loader.
 *
 * @since 0.3.16-canary.0
 */
export type RootColorSchemeLoaderData = {
  /**
   * Resolved `light` or `dark` from the incoming request when detectable
   * (e.g. `Sec-CH-Prefers-Color-Scheme`). Pass to `AppearanceProvider` as `ssrColorScheme` and to
   * `resolveColorScheme(colorScheme, ssrColorScheme)` on `<html>`. When the hint is absent, matches
   * {@link DEFAULT_RESOLVED_COLOR_SCHEME}.
   */
  readonly ssrColorScheme: ResolvedColorScheme;
  /**
   * User preference from the httpOnly cookie: `light`, `dark`, or `automatic`.
   */
  readonly colorScheme: ColorScheme;
};

/* -----------------------------------------------------------------------------
 * Server Functions
 *
 * These functions run on the server and handle cookie-based color scheme persistence.
 * Cookies are httpOnly for security - the client cannot read them directly.
 * -------------------------------------------------------------------------- */

/**
 * Everything needed for the root shell in **one** server call (fewer loader awaits).
 *
 * In your shell: `resolveColorScheme(colorScheme, ssrColorScheme)` on `<html>`, plus `AppearanceScript` and `AppearanceProvider`.
 *
 * @since 0.3.16-canary.0
 */
export const getRootColorSchemeServerFn = createServerFn().handler(
  (): RootColorSchemeLoaderData => ({
    colorScheme: readColorSchemeFromCookie(),
    ssrColorScheme: readSsrColorSchemeFromHeaders(),
  }),
);

/**
 * Read the user's color scheme preference from cookies.
 *
 * Validates the cookie value using Zod schema for type safety.
 * Returns {@link DEFAULT_COLOR_SCHEME} if cookie is missing or invalid.
 *
 * @returns User's stored color scheme preference or default
 *
 * @example
 * ```tsx
 * const colorScheme = await getColorSchemeServerFn();
 * ```
 *
 * @since 0.3.16-canary.0
 */
export const getColorSchemeServerFn = createServerFn().handler((): ColorScheme => readColorSchemeFromCookie());

/**
 * Resolved OS color scheme for SSR / hydration, from Client Hints when the browser sends them.
 *
 * Mirrors client `matchMedia("(prefers-color-scheme: dark)")` when hints are present.
 * Prefer {@link getRootColorSchemeServerFn} for root loaders.
 *
 * Send `Accept-CH: Sec-CH-Prefers-Color-Scheme` (and `Vary`) so navigations include the hint.
 *
 * @since 0.3.16-canary.0
 */
export const getSsrColorSchemeServerFn = createServerFn().handler(
  (): ResolvedColorScheme => readSsrColorSchemeFromHeaders(),
);

/**
 * Persist color scheme preference to an HTTP-only cookie.
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
 * @param data - Color scheme to persist ('light', 'dark', or 'automatic')
 *
 * @see [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/server-functions)
 *
 * @since 0.3.16-canary.0
 */
export const setColorSchemeServerFn = createServerFn({ method: "POST" })
  .validator(colorSchemeSchema)
  .handler(({ data }: { data: ColorScheme }): void => {
    setCookie(STORAGE_KEY, data, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

/**
 * Default {@link AppearanceProvider} `persistColorScheme` for the Start adapter: writes the httpOnly
 * color scheme cookie via {@link setColorSchemeServerFn}.
 *
 * @since 0.3.16-canary.0
 */
export async function persistColorSchemeCookie(value: ColorScheme): Promise<void> {
  await setColorSchemeServerFn({ data: value });
}
