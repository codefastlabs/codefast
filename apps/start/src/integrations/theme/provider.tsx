import type { ThemeProps } from '@/integrations/theme/theme';
import type { JSX } from 'react';
import { ActiveThemeProvider } from '@/integrations/theme/active-theme';
import { Theme } from '@/integrations/theme/theme';

export function Provider({ children, ...props }: ThemeProps): JSX.Element {
  return (
    <Theme {...props}>
      <ActiveThemeProvider>{children}</ActiveThemeProvider>
    </Theme>
  );
}
