import { useRouter } from '@tanstack/react-router';
import { createContext, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import type { ResolvedTheme, Theme } from '@/integrations/theme/types';
import { setThemeServerFn } from '@/integrations/theme/server';

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export type ThemeContextType = {
  readonly theme: Theme;
  readonly resolvedTheme: ResolvedTheme;
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

const MEDIA = '(prefers-color-scheme: dark)';

/**
 * Disables CSS transitions temporarily to prevent animation during theme changes.
 * Respects user's prefers-reduced-motion preference.
 */
function disableAnimation(nonce?: string): () => void {
  // Check if we're in the browser
  if (typeof window === 'undefined') return () => { };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return () => { };
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

/**
 * Helper to get the resolved theme (light/dark) from a Theme value.
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'; // Default for SSR if strictly needed, though usage should be careful
  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

/**
 * Apply the resolved theme to the DOM.
 */
function applyTheme(resolved: ResolvedTheme): void {
  const root = window.document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
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
 * Provider component for managing theme state with system preference support.
 */
export function ThemeProvider({
  children,
  theme: initialTheme,
  disableTransitionOnChange = false,
  nonce,
}: ThemeProviderProps): JSX.Element {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Calculate verified theme for initial state if possible, otherwise default to light/dark based on initialTheme
  // Note: During SSR, we can't know 'system' preference, so we rely on client hydration to fix it if it's 'system'
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (initialTheme === 'system') {
      // If server sent 'system', we might default to one or the other until hydration
      // However, if we access window here (lazy init), we might get it right on client
      if (typeof window !== 'undefined') {
        return getSystemTheme();
      }
      return 'dark'; // Fallback for server-rendering 'system' if not handled by script
    }
    return initialTheme;
  });

  // Handler for system theme changes - using useEffectEvent to read latest theme without re-subscribing
  const onSystemThemeChange = useEffectEvent(() => {
    if (theme === 'system') {
      const newResolved = getSystemTheme();
      setResolvedTheme(newResolved);
      applyTheme(newResolved);
    }
  });

  // Effect to handle system theme changes - only runs once on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA);

    mediaQuery.addEventListener('change', onSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
  }, []);

  // Effect to apply theme when it changes
  useEffect(() => {
    const newResolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(newResolved);
    applyTheme(newResolved);
  }, [theme]);

  const setTheme = useCallback(
    async (value: Theme): Promise<void> => {
      if (value === theme) return;

      const enable = disableTransitionOnChange ? disableAnimation(nonce) : null;

      // Optimistically update
      setThemeState(value);

      // Calculate resolved immediately for UI feedback
      const newResolved = value === 'system' ? getSystemTheme() : value;
      setResolvedTheme(newResolved);
      applyTheme(newResolved);

      try {
        await setThemeServerFn({ data: value });
        await router.invalidate();
      } catch (error) {
        // Revert
        setThemeState(theme);
        // Recalculate original resolved
        const originalResolved = theme === 'system' ? getSystemTheme() : theme;
        setResolvedTheme(originalResolved);
        applyTheme(originalResolved);

        console.error('Failed to set theme:', error);
      } finally {
        enable?.();
      }
    },
    [theme, disableTransitionOnChange, nonce, router],
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/* -----------------------------------------------------------------------------
 * Component: ThemeScript
 * -------------------------------------------------------------------------- */

type ThemeScriptProps = {
  theme: Theme;
};

/**
 * Script to prevent FOUC (Flash of Unstyled Content) by setting the theme class immediately.
 * This must be placed in the <head> of the document.
 */
export function ThemeScript({ theme }: ThemeScriptProps) {
  const themeScript = `
    (function() {
      try {
        var theme = '${theme}';
        var resolvedTheme = theme;
        
        if (theme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.classList.add(resolvedTheme);
        document.documentElement.style.colorScheme = resolvedTheme;
      } catch (e) {}
    })()
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
