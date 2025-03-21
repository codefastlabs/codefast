'use client';

import type { JSX, ReactNode } from 'react';

import Cookies from 'js-cookie';
import { createContext, useContext, useEffect, useState } from 'react';

const THEME_COOKIE_NAME = 'active_theme';
const DEFAULT_THEME = 'default';

function setThemeCookie(theme: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  Cookies.set(THEME_COOKIE_NAME, theme, {
    path: '/',
    expires: 365,
    sameSite: 'Lax',
    secure: window.location.protocol === 'https:',
  });
}

interface ThemeContextType {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: string;
}): JSX.Element {
  const [activeTheme, setActiveTheme] = useState<string>(() => initialTheme ?? DEFAULT_THEME);

  useEffect(() => {
    setThemeCookie(activeTheme);

    const element = document.documentElement;

    for (const className of [...element.classList].filter((currentClass) => currentClass.startsWith('theme-'))) {
      element.classList.remove(className);
    }

    element.classList.add(`theme-${activeTheme}`);

    if (activeTheme.endsWith('-scaled')) {
      element.classList.add('theme-scaled');
    }
  }, [activeTheme]);

  return <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>{children}</ThemeContext.Provider>;
}

export function useThemeConfig(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useThemeConfig must be used within an ActiveThemeProvider');
  }

  return context;
}
