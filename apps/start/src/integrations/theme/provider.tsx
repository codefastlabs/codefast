import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useHydrated } from '@tanstack/react-router';
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

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(storageKey: string): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return (localStorage.getItem(storageKey) as Theme) || null;
  } catch {
    return null;
  }
}

function applyTheme(theme: 'light' | 'dark', attribute: string, enableColorScheme: boolean) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  if (attribute !== 'class') {
    root.setAttribute(attribute, theme);
  }

  if (enableColorScheme) {
    root.style.colorScheme = theme;
  }
}

export function Provider({
  children,
  attribute = 'class',
  defaultTheme = DEFAULT_THEME,
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = THEME_STORAGE_KEY,
  enableColorScheme = true,
}: ThemeProviderProps): JSX.Element {
  const hydrated = useHydrated();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (!hydrated) {
      return defaultTheme;
    }
    return getStoredTheme(storageKey) || defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | undefined>(() => {
    if (!hydrated) {
      return undefined;
    }
    return getSystemTheme();
  });

  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setMounted(true);
    const stored = getStoredTheme(storageKey);
    const initialTheme = stored || defaultTheme;
    setThemeState(initialTheme);

    // Set up system theme listener
    if (enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemTheme(getSystemTheme());

      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [hydrated, storageKey, defaultTheme, enableSystem]);

  // Apply theme changes
  useEffect(() => {
    if (!mounted || !hydrated) {
      return;
    }

    const resolved = theme === 'system' && enableSystem ? systemTheme : theme === 'system' ? 'light' : theme;

    if (resolved && (resolved === 'light' || resolved === 'dark')) {
      if (disableTransitionOnChange) {
        const css = document.createElement('style');
        css.appendChild(
          document.createTextNode(
            '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}',
          ),
        );
        document.head.appendChild(css);

        applyTheme(resolved, attribute, enableColorScheme);

        // Force reflow
        (() => window.getComputedStyle(document.body))();

        // Wait for next tick before removing
        setTimeout(() => {
          document.head.removeChild(css);
        }, 1);
      } else {
        applyTheme(resolved, attribute, enableColorScheme);
      }
    }
  }, [theme, systemTheme, mounted, hydrated, attribute, enableColorScheme, disableTransitionOnChange, enableSystem]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!hydrated) {
        return;
      }

      setThemeState(newTheme);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // Ignore localStorage errors
      }
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

  return (
    <ThemeContext.Provider value={value}>
      <ActiveThemeProvider>{children}</ActiveThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
