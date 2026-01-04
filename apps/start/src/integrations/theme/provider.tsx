import { createContext, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import type { ResolvedTheme, Theme } from '@/integrations/theme/types';
import type { JSX, ReactNode } from 'react';
import { DEFAULT_RESOLVED_THEME, MEDIA, THEME_CHANNEL } from '@/integrations/theme/types';
import { setThemeServerFn } from '@/integrations/theme/server';
import { applyTheme, disableAnimation, getSystemTheme, resolveTheme } from '@/integrations/theme/utils';

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface ThemeContextType {
  readonly theme: Theme;
  readonly resolvedTheme: ResolvedTheme;
  readonly setTheme: (value: Theme) => Promise<void>;
}

type ThemeContextValue = ThemeContextType | null;

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

export const ThemeContext = createContext<ThemeContextValue>(null);

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface ThemeProviderProps {
  children: ReactNode;
  theme: Theme;
  disableTransitionOnChange?: boolean;
  nonce?: string;
}

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
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Calculate verified theme for initial state if possible, otherwise default to light/dark based on initialTheme
  // Note: During SSR, we can't know 'system' preference, so we rely on client hydration to fix it if it's 'system'
  /*
   * Initialize resolvedTheme.
   * We use a lazy initializer to correctly handle 'system' theme on the client
   * while falling back to default on the server.
   */
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(initialTheme));

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
    const newResolved = resolveTheme(theme);
    setResolvedTheme(newResolved);
    applyTheme(newResolved);
  }, [theme]);

  // Handler for cross-tab theme sync - using useEffectEvent to avoid re-subscribing
  const onCrossTabSync = useEffectEvent((newTheme: Theme) => {
    if (newTheme === theme) return;
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  });

  // Effect to handle cross-tab theme sync via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(THEME_CHANNEL);

    channel.onmessage = (event) => {
      onCrossTabSync(event.data as Theme);
    };

    return () => channel.close();
  }, []);

  const setTheme = useCallback(
    async (value: Theme): Promise<void> => {
      if (value === theme) return;

      const enable = disableTransitionOnChange ? disableAnimation(nonce) : null;

      // Optimistically update
      setThemeState(value);

      // Calculate resolved immediately for UI feedback
      const newResolved = resolveTheme(value);
      setResolvedTheme(newResolved);
      applyTheme(newResolved);

      try {
        await setThemeServerFn({ data: value });

        // Notify other tabs about theme change
        const channel = new BroadcastChannel(THEME_CHANNEL);
        channel.postMessage(value);
        channel.close();
      } catch (error) {
        // Revert
        setThemeState(theme);
        // Recalculate original resolved
        const originalResolved = resolveTheme(theme);
        setResolvedTheme(originalResolved);
        applyTheme(originalResolved);

        console.error('Failed to set theme:', error);
      } finally {
        enable?.();
      }
    },
    [theme, disableTransitionOnChange, nonce],
  );

  const value = useMemo<ThemeContextType>(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
