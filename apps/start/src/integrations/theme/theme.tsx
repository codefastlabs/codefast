import { useRouter } from '@tanstack/react-router';
import { createContext, use, useEffect, useState } from 'react';
import { setThemeServerFn } from './server';
import type { ReactNode } from 'react';
import type { Theme } from './server';

/**
 * The theme context value that provides theme state and control methods.
 */
export type ThemeContextType = {
  /** The current theme value ('light' or 'dark'). */
  theme: Theme;
  /** Function to update the theme and persist it to cookie. */
  setTheme: (val: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

type ThemeProps = {
  children: ReactNode;
  /** The initial theme from server (from cookie). */
  theme: Theme;
};

/**
 * Theme provider component that manages theme state using cookies.
 *
 * This component:
 * - Receives the initial theme from the server (via cookie)
 * - Exposes a setTheme function that updates the cookie and invalidates the router
 * - Applies the theme to the document root element
 *
 * @param props - Theme provider props.
 * @param props.children - Child components that will have access to the theme context.
 * @param props.theme - The initial theme from server (from cookie).
 *
 * @example
 * ```tsx
 * <Theme theme="dark">
 *   <App />
 * </Theme>
 * ```
 */
export function Theme({ children, theme: initialTheme }: ThemeProps) {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  function setTheme(val: Theme) {
    setThemeState(val);
    setThemeServerFn({ data: val }).then(() => {
      void router.invalidate();
    });
  }

  const value: ThemeContextType = { theme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the theme context and get theme state and control methods.
 *
 * @returns The theme context value containing theme state and methods.
 * @throws {Error} If called outside of a ThemeProvider component.
 *
 * @example
 * ```tsx
 * function ThemeSwitcher() {
 *   const { theme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Current: {theme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const val = use(ThemeContext);
  if (!val) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return val;
}
