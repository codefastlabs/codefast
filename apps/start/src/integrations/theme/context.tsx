import { createContext } from 'react';
import type { SystemTheme, Theme } from '@/integrations/theme/types';

export type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme | undefined;
  themes: Theme[];
  systemTheme: SystemTheme | undefined;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
