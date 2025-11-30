import { useRouter } from '@tanstack/react-router';
import { createContext, useState } from 'react';
import { setThemeServerFn } from './server';
import type { JSX, ReactNode } from 'react';
import type { Theme } from './server';

export type ThemeContextType = {
  theme: Theme;
  setTheme: (value: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

function disableAnimation(nonce?: string): () => void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return () => {};
  }

  const css = document.createElement('style');

  if (nonce) {
    css.setAttribute('nonce', nonce);
  }

  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
    ),
  );

  document.head.appendChild(css);

  return () => {
    (() => window.getComputedStyle(document.body))();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (css.parentNode) {
          document.head.removeChild(css);
        }
      });
    });
  };
}

type ThemeProps = {
  children: ReactNode;
  theme: Theme;
  disableTransitionOnChange?: boolean;
  nonce?: string;
};

export function ThemeProvider({
  children,
  theme: initialTheme,
  disableTransitionOnChange = false,
  nonce,
}: ThemeProps): JSX.Element {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  function setTheme(value: Theme) {
    const enable = disableTransitionOnChange ? disableAnimation(nonce) : null;

    setThemeState(value);
    setThemeServerFn({ data: value }).then(async () => {
      await router.invalidate();
      enable?.();
    });
  }

  const value: ThemeContextType = { theme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
