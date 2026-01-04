import type { Theme } from '@/types';

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
 * 2. Adds the theme class to `<html>` immediately
 * 3. Sets `color-scheme` for native form controls and scrollbars
 *
 * @example
 * ```tsx
 * // In __root.tsx (TanStack Start)
 * <head>
 *   <ThemeScript theme={theme} />
 * </head>
 * ```
 */
export function ThemeScript({ theme }: ThemeScriptProps) {
  // Minified FOUC prevention script
  const themeScript = `(function(){try{var theme="${theme}",resolvedTheme=theme;"system"===theme&&(resolvedTheme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),document.documentElement.classList.add(resolvedTheme),document.documentElement.style.colorScheme=resolvedTheme}catch(error){}})()`;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
