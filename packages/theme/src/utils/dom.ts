import type { ResolvedTheme } from '@/types';

/* -----------------------------------------------------------------------------
 * DOM Utilities
 * -------------------------------------------------------------------------- */

/**
 * Apply the resolved theme to the DOM.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = window.document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/**
 * Disables CSS transitions temporarily to prevent animation during theme changes.
 * Respects user's prefers-reduced-motion preference.
 */
export function disableAnimation(nonce?: string): () => void {
  if (typeof window === 'undefined') return () => {};

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return () => {};
  }

  const css = document.createElement('style');

  if (nonce) {
    css.setAttribute('nonce', nonce);
  }

  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
    ),
  );

  document.head.appendChild(css);

  return () => {
    // Force a reflow
    (() => window.getComputedStyle(document.body))();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (css.parentNode) {
          document.head.removeChild(css);
        }
      });
    });
  };
}
