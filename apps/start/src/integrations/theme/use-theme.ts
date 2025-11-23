import { useContext } from 'react';
import type { ThemeContextType } from '@/integrations/theme/context';
import { ThemeContext } from '@/integrations/theme/context';

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
