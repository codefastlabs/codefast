import type { ThemeProps } from '@/integrations/theme/theme';
import type { JSX } from 'react';
import { ActiveThemeProvider } from '@/integrations/theme/active-theme';
import { Theme } from '@/integrations/theme/theme';

/**
 * Combined theme provider that wraps both Theme and ActiveThemeProvider.
 *
 * This component provides a convenient way to set up both the color theme
 * system (light/dark/system) and the active theme system (for custom theme variants)
 * in a single provider.
 *
 * @param props - Theme configuration props (same as ThemeProps).
 * @param props.children - Child components that will have access to both theme contexts.
 *
 * @returns A provider tree with both Theme and ActiveThemeProvider.
 *
 * @example
 * ```tsx
 * <Provider defaultTheme="system" enableSystem={true}>
 *   <App />
 * </Provider>
 * ```
 */
export function Provider({ children, ...props }: ThemeProps): JSX.Element {
  return (
    <Theme {...props}>
      <ActiveThemeProvider>{children}</ActiveThemeProvider>
    </Theme>
  );
}
