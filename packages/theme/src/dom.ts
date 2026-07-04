import type { ColorScheme } from "#/appearance";

/* -----------------------------------------------------------------------------
 * DOM Utilities
 * -------------------------------------------------------------------------- */

/**
 * Apply a color scheme to the DOM by updating the `<html>` element.
 *
 * Updates both:
 * - CSS class (for Tailwind's `dark:` variants)
 * - `color-scheme` style (for native form controls and scrollbars)
 *
 * @since 0.3.16-canary.0
 */
export function applyColorScheme(colorScheme: ColorScheme): void {
  const root = window.document.documentElement;

  root.classList.remove("light", "dark", "automatic");
  root.classList.add(colorScheme);
  root.style.colorScheme = colorScheme;
}

/**
 * Temporarily suppress all CSS transitions during appearance changes.
 *
 * Prevents jarring color animations when switching between light/dark appearances.
 * Respects user's `prefers-reduced-motion` preference (does nothing if enabled).
 *
 * @param nonce - Optional CSP nonce for the injected style element
 * @returns Cleanup function to re-enable transitions. Call after the color scheme is applied.
 *
 * @example
 * ```tsx
 * const enableTransitions = suppressTransitions();
 * applyColorScheme('dark');
 * enableTransitions(); // Re-enables CSS transitions
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function suppressTransitions(nonce?: string): () => void {
  if (typeof globalThis.window === "undefined") {
    return () => {
      /* noop */
    };
  }

  // Respect user's motion preferences
  const prefersReducedMotion = globalThis.window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return () => {
      /* noop */
    };
  }

  // Inject style to suppress all transitions
  const css = document.createElement("style");

  if (nonce) {
    css.setAttribute("nonce", nonce);
  }

  // Only the unprefixed property is needed — all modern browsers support it
  css.append(document.createTextNode(`*,*::before,*::after{transition:none!important}`));

  document.head.append(css);

  return () => {
    // Force reflow to ensure styles are applied before removing
    void window.getComputedStyle(document.body);

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
