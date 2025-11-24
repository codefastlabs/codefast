import { use } from 'react';
import { ThemeContext } from 'src/integrations/theme/provider';
import type { ThemeContextType } from 'src/integrations/theme/provider';

export function useTheme(): ThemeContextType {
  const value = use(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return value;
}
