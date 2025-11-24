import { useRouter } from '@tanstack/react-router';
import { createContext, useState } from 'react';
import { setThemeServerFn } from './server';
import type { JSX, ReactNode } from 'react';
import type { Theme } from './server';

/**
 * Type definition for the theme context value.
 *
 * This type describes the shape of the context value provided by ThemeProvider.
 * It includes the current theme state and a function to update it. Components
 * consuming this context will receive both the current theme and the ability
 * to change it.
 */
export type ThemeContextType = {
  /**
   * The current active theme.
   *
   * This value represents the user's current theme preference, which can be
   * either 'light' or 'dark'. It is synchronized between client and server
   * state through cookies.
   */
  theme: Theme;
  /**
   * Function to update the current theme.
   *
   * When called, this function updates both the local React state and persists
   * the preference to the server via cookies. After the server operation
   * completes, it invalidates the router to trigger a re-render with the new
   * theme applied.
   *
   * @param value - The new theme value to apply. Must be either
   *                'light' or 'dark'.
   */
  setTheme: (value: Theme) => void;
};

/**
 * React context for theme management.
 *
 * This context provides access to the theme state and setter function throughout
 * the component tree. The context value is null by default, which allows the
 * useTheme hook to detect when it's used outside of a ThemeProvider.
 *
 * @see ThemeProvider - The provider component that supplies this context.
 * @see useTheme - The hook to access this context.
 */
export const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Props for the ThemeProvider component.
 */
type ThemeProps = {
  /**
   * Child components that will have access to the theme context.
   *
   * These components can use the useTheme hook to access and modify the
   * current theme state.
   */
  children: ReactNode;
  /**
   * The initial theme value to use.
   *
   * This value is typically obtained from the server-side loader (via
   * getThemeServerFn) and represents the user's saved preference or the
   * default theme. It is used to initialize the client-side state.
   */
  theme: Theme;
};

/**
 * Provider component that manages theme state and provides it to child components.
 *
 * This component wraps the application (or a portion of it) and provides theme
 * state management through React Context. It maintains the current theme in
 * local state and synchronizes it with the server via cookies.
 *
 * When the theme is changed through the setTheme function, the component:
 * 1. Updates the local React state immediately (optimistic update)
 * 2. Persists the preference to the server via setThemeServerFn
 * 3. Invalidates the router to trigger a re-render with the new theme
 *
 * The theme is typically applied to the root HTML element as a className,
 * allowing CSS to respond to theme changes through selectors like `.dark` or
 * `.light`.
 *
 * @param props - The theme provider props containing:
 *   - `children`: Child components that will have access to the theme context.
 *   - `theme`: The initial theme value, usually obtained from the server-side route loader.
 *
 * @returns A ThemeContext.Provider wrapping the children with theme state and setter function.
 *
 * @example
 * ```tsx
 * // In root route component
 * function RootShellComponent({ children }) {
 *   const theme = Route.useLoaderData(); // From getThemeServerFn()
 *
 *   return (
 *     <html className={theme}>
 *       <body>
 *         <ThemeProvider theme={theme}>
 *           {children}
 *         </ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * // In child components
 * function ThemeSwitcher() {
 *   const { theme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Toggle theme
 *     </button>
 *   );
 * }
 * ```
 */
export function ThemeProvider({ children, theme: initialTheme }: ThemeProps): JSX.Element {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  /**
   * Updates the theme state and persists it to the server.
   *
   * This function performs an optimistic update by immediately updating the
   * local state, then synchronizing with the server. After the server operation
   * completes, it invalidates the router to ensure the new theme is applied
   * consistently across the application.
   *
   * @param value - The new theme value to apply.
   */
  function setTheme(value: Theme) {
    setThemeState(value);
    setThemeServerFn({ data: value }).then(() => {
      void router.invalidate();
    });
  }

  const value: ThemeContextType = { theme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
