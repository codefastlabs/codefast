'use client';

import { ThemeProvider } from './theme-provider';
import { ActiveThemeProvider } from './active-theme';
import type { JSX, ReactNode } from 'react';

export function Provider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ThemeProvider>
      <ActiveThemeProvider>{children}</ActiveThemeProvider>
    </ThemeProvider>
  );
}
