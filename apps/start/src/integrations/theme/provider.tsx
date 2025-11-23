'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ActiveThemeProvider } from './active-theme';
import type { ComponentProps, JSX, ReactNode } from 'react';

type ProviderProps = ComponentProps<typeof NextThemesProvider>;

export function Provider({ children, ...props }: ProviderProps): JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
      {...props}
    >
      <ActiveThemeProvider>{children}</ActiveThemeProvider>
    </NextThemesProvider>
  );
}
