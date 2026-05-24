import type { JSX } from "react";

import type { Theme } from "#/types";

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

export interface ThemeScriptProps {
  /**
   * Initial theme from server (e.g., from cookie via loader).
   *
   * When `storageKey` is provided, this acts as a fallback if the storage entry is absent
   * or contains an unrecognised value.
   */
  theme: Theme;
  /**
   * CSP nonce applied to the inline script element.
   */
  nonce?: string;
  /**
   * When provided, the inline script reads `localStorage.getItem(storageKey)` before
   * first paint and uses that value if it is a recognised theme (`"light"`, `"dark"`,
   * or `"system"`). Falls back to `theme` when the key is absent or invalid.
   *
   * Use this for client-only React apps that persist the theme in `localStorage` instead
   * of an HTTP cookie to prevent FOUC.
   *
   * @example
   * ```tsx
   * <ThemeScript theme="system" storageKey="my-app-theme" />
   * ```
   */
  storageKey?: string;
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

/**
 * Inline script that prevents Flash of Unstyled Content (FOUC).
 *
 * **Why this is needed:**
 * React hydration occurs after the browser has already painted the page.
 * Without this script, users would briefly see the wrong theme before
 * React takes over and applies the correct one.
 *
 * **How it works:**
 * This script runs synchronously in the `<head>` before first paint:
 * 1. Resolves 'system' to 'light' or 'dark' using `matchMedia()`
 * 2. Removes prior `light` / `dark` / `system` classes on `<html>` (SSR may
 *    have applied the wrong resolved class for `system`, e.g. default `dark`)
 * 3. Adds the resolved theme class and sets `color-scheme` for native controls
 *
 * @example
 * ```tsx
 * // In __root.tsx (TanStack Start)
 * <head>
 *   <ThemeScript theme={theme} />
 * </head>
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function ThemeScript({ nonce, storageKey, theme }: ThemeScriptProps): JSX.Element {
  // S2: Use JSON.stringify for safe JS string serialisation — guards against injection if
  // TypeScript's type-narrowing is bypassed (e.g. a raw string from an unvalidated source).
  // F1: When storageKey is provided, the script reads localStorage before first paint so
  // client-only apps (no SSR cookie) get the right theme without FOUC.
  // sk=null short-circuits to s=null so theme falls back to fbt — backward-compatible.
  const themeScript = `(function(){try{var sk=${JSON.stringify(storageKey ?? null)},fbt=${JSON.stringify(theme)},s=sk&&localStorage.getItem(sk),theme=(s==="light"||s==="dark"||s==="system")?s:fbt,resolvedTheme=theme;"system"===theme&&(resolvedTheme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),document.documentElement.classList.remove("light","dark","system"),document.documentElement.classList.add(resolvedTheme),document.documentElement.style.colorScheme=resolvedTheme}catch(e){}})()`;
  const nonceProps = nonce === undefined ? {} : { nonce };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
      {...nonceProps}
    />
  );
}
