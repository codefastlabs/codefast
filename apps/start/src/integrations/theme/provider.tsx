import { useRouter } from '@tanstack/react-router';
import { createContext, useCallback, useMemo, useState } from 'react';
import { setThemeServerFn } from './server';
import type { JSX, ReactNode } from 'react';
import type { Theme } from './server';

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export type ThemeContextType = {
  readonly theme: Theme;
  readonly setTheme: (value: Theme) => Promise<void>;
};

type ThemeContextValue = ThemeContextType | null;

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

export const ThemeContext = createContext<ThemeContextValue>(null);

/* -----------------------------------------------------------------------------
 * Utilities
 * -------------------------------------------------------------------------- */

/**
 * Disables CSS transitions temporarily to prevent animation during theme changes.
 * Respects user's prefers-reduced-motion preference.
 *
 * @param nonce - Optional nonce for Content Security Policy
 * @returns A cleanup function to re-enable transitions
 */
function disableAnimation(nonce?: string): () => void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return () => {
      // No-op if user prefers reduced motion
    };
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
    // Force a reflow to ensure styles are applied
    void window.getComputedStyle(document.body);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (css.parentNode) {
          document.head.removeChild(css);
        }
      });
    });
  };
}

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

type ThemeProviderProps = {
  children: ReactNode;
  theme: Theme;
  disableTransitionOnChange?: boolean;
  nonce?: string;
};

/* -----------------------------------------------------------------------------
 * Component: ThemeProvider
 * -------------------------------------------------------------------------- */

/**
 * Provider component for managing theme state.
 *
 * This component manages the application's theme (light/dark) and provides
 * it to all child components via React Context. It also handles theme persistence
 * through server functions and router invalidation for SSR compatibility.
 *
 * @param props - The theme provider props:
 *   - `children`: Child components that will have access to the theme context
 *   - `theme`: Initial theme value (typically from server-side loader)
 *   - `disableTransitionOnChange`: Whether to disable CSS transitions during theme changes
 *   - `nonce`: Optional nonce for Content Security Policy
 *
 * @returns A ThemeContext.Provider wrapping the children with theme state
 *
 * @example
 * ```tsx
 * <ThemeProvider theme="dark" disableTransitionOnChange>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  theme: initialTheme,
  disableTransitionOnChange = false,
  nonce,
}: ThemeProviderProps): JSX.Element {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback(
    async (value: Theme): Promise<void> => {
      // Early return if the theme hasn't changed
      if (value === theme) {
        return;
      }

      const enable = disableTransitionOnChange ? disableAnimation(nonce) : null;

      // Optimistically update local state
      setThemeState(value);

      try {
        // Persist theme to server
        await setThemeServerFn({ data: value });
        // Invalidate router to sync server state
        await router.invalidate();
      } catch (error) {
        // Revert state on error
        setThemeState(theme);
        console.error('Failed to set theme:', error);
        throw error;
      } finally {
        // Re-enable transitions after theme change
        enable?.();
      }
    },
    [theme, disableTransitionOnChange, nonce, router],
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
