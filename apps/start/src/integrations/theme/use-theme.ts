import { use } from 'react';
import { ThemeContext } from 'src/integrations/theme/provider';
import type { ThemeContextType } from 'src/integrations/theme/provider';

/**
 * Custom hook to access the theme context.
 *
 * This hook provides a convenient way to access the theme state and setter
 * function from any component within the ThemeProvider tree. It uses React's
 * `use` hook to read the context value, which allows it to work with both
 * synchronous and asynchronous context updates.
 *
 * The hook performs a runtime check to ensure it's being used within a
 * ThemeProvider. If the context value is null (indicating the hook is used
 * outside of a provider), it throws a descriptive error to help developers
 * identify the issue.
 *
 * @returns An object containing:
 *   - `theme`: The current active theme ('light' or 'dark')
 *   - `setTheme`: A function to update the theme and persist it to the server
 *
 * @throws Error If the hook is called outside of a ThemeProvider component.
 *                 The error message will indicate that useTheme must be used
 *                 within a ThemeProvider.
 *
 * @example
 * ```tsx
 * // Basic usage - reading the current theme
 * function Header() {
 *   const { theme } = useTheme();
 *
 *   return (
 *     <header className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
 *       Header content
 *     </header>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Changing the theme
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTheme();
 *
 *   const toggleTheme = () => {
 *     setTheme(theme === 'dark' ? 'light' : 'dark');
 *   };
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Switch to {theme === 'dark' ? 'light' : 'dark'} mode
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditional rendering based on theme
 * function ThemedComponent() {
 *   const { theme } = useTheme();
 *
 *   return (
 *     <div>
 *       {theme === 'dark' ? (
 *         <MoonIcon />
 *       ) : (
 *         <SunIcon />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see ThemeProvider - The provider component that supplies the theme context.
 * @see ThemeContext - The React context used internally by this hook.
 */
export function useTheme(): ThemeContextType {
  const value = use(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return value;
}
