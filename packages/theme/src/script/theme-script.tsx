import type { JSX } from "react";

import type { Theme } from "#/types";

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface ThemeScriptProps {
  /**
   * Initial theme from server (e.g., from cookie via loader).
   */
  theme: Theme;
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
export function ThemeScript({ theme }: ThemeScriptProps): JSX.Element {
  // Minified FOUC prevention script
  const themeScript = `(function(){try{var theme="${theme}",resolvedTheme=theme;"system"===theme&&(resolvedTheme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),document.documentElement.classList.remove("light","dark","system"),document.documentElement.classList.add(resolvedTheme),document.documentElement.style.colorScheme=resolvedTheme}catch(error){}})()`;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
