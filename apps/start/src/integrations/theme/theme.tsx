import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useHydrated } from '@tanstack/react-router';
import type { ThemeContextType } from '@/integrations/theme/context';
import type { JSX, ReactNode } from 'react';
import type { Theme } from '@/integrations/theme/types';
import { ThemeContext } from '@/integrations/theme/context';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/integrations/theme/constants';
import { applyTheme, getStoredTheme, getSystemTheme, setStoredTheme } from '@/integrations/theme/utils';

export type ThemeProps = {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
};

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
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | undefined>(undefined);

  const handleSystemThemeChange = useEffectEvent((e: MediaQueryListEvent) => {
    setSystemTheme(e.matches ? 'dark' : 'light');
  });

  const applyThemeToDOM = useEffectEvent((resolvedTheme: 'light' | 'dark') => {
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
      const newTheme = storageEvent.newValue as Theme;
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

    const resolved = theme === 'system' && enableSystem ? systemTheme : theme === 'system' ? 'light' : theme;

    if (resolved) {
      applyThemeToDOM(resolved);
    }
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
      return systemTheme;
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
