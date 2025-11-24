import type { JSX, ReactNode } from 'react';
import type { Theme as ThemeType } from '@/integrations/theme/server';
import { ActiveThemeProvider } from '@/integrations/theme/active-theme';
import { Theme } from '@/integrations/theme/theme';

/**
 * Combined theme provider that wraps both Theme and ActiveThemeProvider.
 *
 * This component provides a convenient way to set up both the color theme
 * system (light/dark) and the active theme system (for custom theme variants)
 * in a single provider.
 *
 * @param props - Theme provider props.
 * @param props.children - Child components that will have access to both theme contexts.
 * @param props.theme - The initial theme from server (from cookie).
 *
 * @returns A provider tree with both Theme and ActiveThemeProvider.
 *
 * @example
 * ```tsx
 * <Provider theme="dark">
 *   <App />
 * </Provider>
 * ```
 */
type ProviderProps = {
  children: ReactNode;
  theme: ThemeType;
};

export function Provider({ children, theme }: ProviderProps): JSX.Element {
  return (
    <Theme theme={theme}>
      <ActiveThemeProvider>{children}</ActiveThemeProvider>
    </Theme>
  );
}
