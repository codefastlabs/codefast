import { createContext } from 'react';
import type { Theme } from '@/integrations/theme/types';

export type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | undefined;
  themes: Theme[];
  systemTheme: 'light' | 'dark' | undefined;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
