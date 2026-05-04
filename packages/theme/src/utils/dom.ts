import type { ResolvedTheme } from "#/types";

/* -----------------------------------------------------------------------------
 * DOM Utilities
 * -------------------------------------------------------------------------- */

/**
 * Apply theme to the DOM by updating `<html>` element.
 *
 * Updates both:
 * - CSS class (for Tailwind's `dark:` variants)
 * - `color-scheme` style (for native form controls and scrollbars)
 *
 * @param resolved - The resolved theme to apply ('light' or 'dark')
 *
 * @since 0.3.16-canary.0
 */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = window.document.documentElement;

  root.classList.remove("light", "dark", "system");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/**
 * Temporarily disable all CSS transitions during theme changes.
 *
 * Prevents jarring color animations when switching between light/dark themes.
 * Respects user's `prefers-reduced-motion` preference (does nothing if enabled).
 *
 * @param nonce - Optional CSP nonce for the injected style element
 * @returns Cleanup function to re-enable transitions. Call after theme is applied.
 *
 * @example
 * ```tsx
 * const enableTransitions = disableAnimation();
 * applyTheme('dark');
 * enableTransitions(); // Re-enables CSS transitions
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function disableAnimation(nonce?: string): () => void {
  if (typeof globalThis.window === "undefined") {
    return () => {
      /* noop */
    };
  }

  // Respect user's motion preferences
  const prefersReducedMotion = globalThis.window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    return () => {
      /* noop */
    };
  }

  // Inject style to disable all transitions
  const css = document.createElement("style");

  if (nonce) {
    css.setAttribute("nonce", nonce);
  }

  css.append(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
    ),
  );

  document.head.append(css);

  return () => {
    // Force reflow to ensure styles are applied before removing
    ((): CSSStyleDeclaration => window.getComputedStyle(document.body))();

    // Use double RAF to ensure paint happens before removing style
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (css.parentNode) {
          css.remove();
        }
      });
    });
  };
}
