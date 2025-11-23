import { createContext, useCallback, useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useHydrated } from '@tanstack/react-router';
import { createClientOnlyFn } from '@tanstack/react-start';
import { ActiveThemeProvider } from './active-theme';
import type { JSX, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | undefined;
  themes: Theme[];
  systemTheme: 'light' | 'dark' | undefined;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'system';

const getSystemTheme = createClientOnlyFn((): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

const getStoredTheme = createClientOnlyFn((storageKey: string): Theme | null => {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? (value as Theme) : null;
  } catch {
    return null;
  }
});

const setStoredTheme = createClientOnlyFn((storageKey: string, theme: Theme): void => {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // noop
  }
});

const applyTheme = createClientOnlyFn(
  (theme: 'light' | 'dark', attribute: string, enableColorScheme: boolean): void => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    if (attribute !== 'class') {
      root.setAttribute(attribute, theme);
    }

    if (enableColorScheme) {
      root.style.colorScheme = theme;
    }
  },
);

function Theme({
  children,
  attribute = 'class',
  defaultTheme = DEFAULT_THEME,
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = THEME_STORAGE_KEY,
  enableColorScheme = true,
}: ThemeProviderProps): JSX.Element {
  const hydrated = useHydrated();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);

    if (enableSystem) {
      const initialSystemTheme = getSystemTheme();
      setSystemTheme(initialSystemTheme);
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
    if (!mounted || !hydrated) {
      return;
    }

    const resolved = theme === 'system' && enableSystem ? systemTheme : theme === 'system' ? 'light' : theme;

    if (resolved) {
      applyThemeToDOM(resolved);
    }
  }, [theme, systemTheme, mounted, hydrated, enableSystem]);

  useEffect(() => {
    if (!mounted || !hydrated) {
      return;
    }

    const resolved = theme === 'system' && enableSystem ? systemTheme : theme === 'system' ? 'light' : theme;

    if (resolved) {
      applyThemeToDOM(resolved);
    }
  }, [attribute, enableColorScheme, disableTransitionOnChange, mounted, hydrated, theme, enableSystem, systemTheme]);

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
    if (!mounted || !hydrated) {
      return undefined;
    }
    if (theme === 'system' && enableSystem) {
      return systemTheme;
    }
    return theme === 'system' ? 'light' : theme;
  }, [theme, systemTheme, mounted, hydrated, enableSystem]);

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

export function Provider({ children, ...props }: ThemeProviderProps): JSX.Element {
  return (
    <Theme {...props}>
      <ActiveThemeProvider>{children}</ActiveThemeProvider>
    </Theme>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
