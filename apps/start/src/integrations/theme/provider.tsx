import { useRouter } from '@tanstack/react-router';
import { createContext, useState } from 'react';
import { setThemeServerFn } from './server';
import type { ReactNode } from 'react';
import type { Theme } from './server';

export type ThemeContextType = {
  theme: Theme;
  setTheme: (value: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

type ThemeProps = {
  children: ReactNode;
  theme: Theme;
};

export function ThemeProvider({ children, theme: initialTheme }: ThemeProps) {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  function setTheme(value: Theme) {
    setThemeState(value);
    setThemeServerFn({ data: value }).then(() => {
      void router.invalidate();
    });
  }

  const value: ThemeContextType = { theme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
