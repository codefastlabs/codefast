import { createContext, useContext, useEffect, useEffectEvent, useState } from "react";
import type { ReactNode } from "react";

/**
 * The default active theme name when no initial theme is provided.
 */
const DEFAULT_THEME = "default";

/**
 * The active theme context value type.
 *
 * This context manages a separate theme system from the color theme (light/dark).
 * It's used for applying custom theme variants (e.g., 'blue', 'green', 'purple')
 * that can be combined with the color theme.
 */
type ThemeContextType = {
  /** The current active theme name (e.g., 'default', 'blue', 'green'). */
  activeTheme: string;
  /** Function to change the active theme. */
  setActiveTheme: (theme: string) => void;
};

/**
 * React context for active theme management.
 *
 * This context is separate from the color theme context and is used for
 * managing custom theme variants that can be applied alongside the color theme.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props for the ActiveThemeProvider component.
 */
type ActiveThemeProviderProps = {
  /** Child components that will have access to the active theme context. */
  children: ReactNode;
  /** The initial active theme to apply. Defaults to 'default'. */
  initialTheme?: string;
};

/**
 * Provider component for managing active theme variants.
 *
 * This component manages a separate theme system from the color theme (light/dark).
 * It applies theme classes to the document body in the format `theme-{name}`.
 * Themes ending with '-scaled' will also receive the 'theme-scaled' class.
 *
 * The active theme is applied to the body element, allowing for custom theme
 * variants that work alongside the color theme system.
 *
 * @param props - The active theme provider props containing:
 *   - `children`: Child components that will have access to the active theme context.
 *   - `initialTheme`: The initial active theme to apply. Defaults to 'default'.
 *
 * @returns A ThemeContext.Provider wrapping the children with active theme state.
 *
 * @example
 * ```tsx
 * <ActiveThemeProvider initialTheme="blue">
 *   <App />
 * </ActiveThemeProvider>
 * ```
 */
export function ActiveThemeProvider({ children, initialTheme }: ActiveThemeProviderProps) {
  const [activeTheme, setActiveTheme] = useState<string>(() => initialTheme || DEFAULT_THEME);

  const applyActiveTheme = useEffectEvent((theme: string) => {
    Array.from(document.body.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => {
        document.body.classList.remove(className);
      });
    document.body.classList.add(`theme-${theme}`);

    if (theme.endsWith("-scaled")) {
      document.body.classList.add("theme-scaled");
    }
  });

  useEffect(() => {
    applyActiveTheme(activeTheme);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Access the active theme context and get active theme state and control methods.
 *
 * This hook provides access to the active theme context value, which manages
 * custom theme variants (separate from the color theme system).
 *
 * @returns The active theme context value containing activeTheme and setActiveTheme.
 *
 * @throws Error If called outside of an ActiveThemeProvider component.
 *
 * @example
 * ```tsx
 * function ThemeVariantSwitcher() {
 *   const { activeTheme, setActiveTheme } = useThemeConfig();
 *
 *   return (
 *     <select value={activeTheme} onChange={(e) => setActiveTheme(e.target.value)}>
 *       <option value="default">Default</option>
 *       <option value="blue">Blue</option>
 *       <option value="green">Green</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useThemeConfig() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useThemeConfig must be used within an ActiveThemeProvider");
  }

  return context;
}
