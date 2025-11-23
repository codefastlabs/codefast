import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useHydrated } from '@tanstack/react-router';
import type { ThemeContextType } from '@/integrations/theme/context';
import type { JSX, ReactNode } from 'react';
import type { SystemTheme, Theme } from '@/integrations/theme/types';
import { ThemeContext } from '@/integrations/theme/context';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/integrations/theme/constants';
import { applyTheme, getStoredTheme, getSystemTheme, setStoredTheme } from '@/integrations/theme/utils';

/**
 * Props for the Theme component.
 */
export type ThemeProps = {
  /** Child components that will have access to the theme context. */
  children: ReactNode;
  /** The HTML attribute to apply the theme to ('class' or 'data-theme'). Defaults to 'class'. */
  attribute?: string;
  /** The default theme to use when no stored preference exists. Defaults to 'system'. */
  defaultTheme?: Theme;
  /** Whether to enable system theme detection. Defaults to true. */
  enableSystem?: boolean;
  /** Whether to disable CSS transitions when changing themes to prevent flash. Defaults to false. */
  disableTransitionOnChange?: boolean;
  /** Whether to set the CSS color-scheme property. Defaults to true. */
  enableColorScheme?: boolean;
  /** The localStorage key to store the theme preference. Defaults to 'theme'. */
  storageKey?: string;
};

/**
 * Theme provider component that manages theme state and applies it to the DOM.
 *
 * This component handles:
 * - Reading and persisting theme preferences from localStorage
 * - Detecting and responding to system theme changes
 * - Applying the theme to the document root element
 * - Synchronizing theme changes across browser tabs via storage events
 * - Providing theme state and control methods via context
 *
 * The component only initializes and applies themes after hydration to prevent
 * hydration mismatches between server and client.
 *
 * @param props - The theme configuration props.
 *
 * @returns A ThemeContext.Provider wrapping the children with theme state.
 *
 * @example
 * ```tsx
 * <Theme defaultTheme="dark" enableSystem={true}>
 *   <App />
 * </Theme>
 * ```
 */
export function Theme({
  children,
  attribute = 'class',
  defaultTheme = DEFAULT_THEME,
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = THEME_STORAGE_KEY,
  enableColorScheme = true,
}: ThemeProps): JSX.Element {
  const hydrated = useHydrated();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<SystemTheme | undefined>(undefined);

  const handleSystemThemeChange = useEffectEvent((e: MediaQueryListEvent) => {
    setSystemTheme(e.matches ? 'dark' : 'light');
  });

  const applyThemeToDOM = useEffectEvent((resolvedTheme: Theme) => {
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}',
        ),
      );
      document.head.appendChild(css);

      applyTheme(resolvedTheme, attribute, enableColorScheme);

      (() => window.getComputedStyle(document.body))();

      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    } else {
      applyTheme(resolvedTheme, attribute, enableColorScheme);
    }
  });

  const initializeTheme = useEffectEvent(() => {
    const stored = getStoredTheme(storageKey);
    const initialTheme = stored || defaultTheme;
    setThemeState(initialTheme);

    if (enableSystem) {
      const initialSystemTheme = getSystemTheme();
      setSystemTheme(initialSystemTheme);
    }
  });

  const handleStorageChange = useEffectEvent((storageEvent: StorageEvent) => {
    if (storageEvent.key === storageKey && storageEvent.newValue) {
      const newTheme = storageEvent.newValue;
      setThemeState(newTheme);
    }
  });

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    initializeTheme();
  }, [hydrated, storageKey, defaultTheme, enableSystem]);

  useEffect(() => {
    if (!hydrated || !enableSystem) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [hydrated, enableSystem]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    // Resolve theme: 'system' -> systemTheme or 'light', otherwise use theme as-is (including custom strings)
    const resolved: Theme =
      theme === 'system' && enableSystem ? (systemTheme ?? 'light') : theme === 'system' ? 'light' : theme;

    applyThemeToDOM(resolved);
  }, [theme, systemTheme, hydrated, enableSystem, attribute, enableColorScheme, disableTransitionOnChange]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [hydrated]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!hydrated) {
        return;
      }

      setThemeState(newTheme);
      setStoredTheme(storageKey, newTheme);
    },
    [hydrated, storageKey],
  );

  const resolvedTheme = useMemo(() => {
    if (!hydrated) {
      return undefined;
    }
    if (theme === 'system' && enableSystem) {
      return systemTheme ?? undefined;
    }
    return theme === 'system' ? 'light' : theme;
  }, [theme, systemTheme, hydrated, enableSystem]);

  const themes: Theme[] = enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'];

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    themes,
    systemTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
