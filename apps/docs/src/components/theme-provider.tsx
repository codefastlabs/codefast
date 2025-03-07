'use client';

import type { ComponentProps, JSX } from 'react';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps): JSX.Element {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
