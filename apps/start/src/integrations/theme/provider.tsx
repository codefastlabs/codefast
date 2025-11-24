import { createContext, useCallback, useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useHydrated } from '@tanstack/react-router';
import { createClientOnlyFn } from '@tanstack/react-start';
import type { JSX, ReactNode } from 'react';
import { ActiveThemeProvider } from '@/integrations/theme/active-theme';

/**
 * The theme value that can be applied to the application.
 *
 * Supports built-in themes ('light', 'dark', 'system') or custom theme strings.
 * When set to 'system', the theme will automatically follow the user's OS preference.
 *
 * @example
 * 'light' | 'dark' | 'system' | 'custom-theme-name'
 */
export type Theme = 'light' | 'dark' | 'system' | string;

/**
 * The resolved system theme preference from the user's OS.
 *
 * This represents the actual color scheme preference detected from the system,
 * which can only be 'light' or 'dark'.
 */
export type SystemTheme = 'light' | 'dark';

/**
 * The theme context value that provides theme state and control methods.
 *
 * This type defines the shape of the context value that is provided by the
 * Theme component and consumed by the useTheme hook.
 */
export type ThemeContextType = {
  /** The current theme value (may be 'system' if following OS preference). */
  theme: Theme;
  /** Function to update the theme and persist it to localStorage. */
  setTheme: (theme: Theme) => void;
  /** The resolved theme value (never 'system', always 'light' or 'dark' or custom theme). */
  resolvedTheme: Theme | undefined;
  /** Available theme options based on enableSystem prop. */
  themes: Theme[];
  /** The current system theme preference ('light' or 'dark') if system detection is enabled. */
  systemTheme: SystemTheme | undefined;
};

/**
 * The key used to store the theme preference in localStorage.
 *
 * This key is used to persist the user's theme selection across page reloads
 * and browser sessions.
 */
export const THEME_STORAGE_KEY = 'theme';

/**
 * The default theme applied when no stored preference exists.
 *
 * By default, this is set to 'system' which will follow the user's OS preference.
 */
export const DEFAULT_THEME: Theme = 'system';

/**
 * Default value for the HTML attribute to apply the theme to.
 * Defaults to 'class'.
 */
export const DEFAULT_THEME_ATTRIBUTE = 'class';

/**
 * Default value for enabling system theme detection.
 * Defaults to true.
 */
export const DEFAULT_ENABLE_SYSTEM = true;

/**
 * Default value for enabling CSS color-scheme property.
 * Defaults to true.
 */
export const DEFAULT_ENABLE_COLOR_SCHEME = true;

/**
 * Get the current system theme preference from the user's OS.
 *
 * This function queries the browser's media query API to detect whether
 * the user prefers a dark or light color scheme.
 *
 * @returns The system theme preference: 'dark' if dark mode is preferred, 'light' otherwise.
 *
 * @throws This function is client-only and will throw if called during SSR.
 */
export const getSystemTheme = createClientOnlyFn((): SystemTheme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

/**
 * Retrieve the stored theme preference from localStorage.
 *
 * This function safely reads the theme value from localStorage using the provided
 * storage key. If the key doesn't exist or an error occurs, it returns null.
 *
 * @param storageKey - The localStorage key to read the theme from.
 *
 * @returns The stored theme value, or null if not found or if an error occurred.
 *
 * @throws This function is client-only and will throw if called during SSR.
 */
export const getStoredTheme = createClientOnlyFn((storageKey: string): Theme | null => {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? value : null;
  } catch {
    return null;
  }
});

/**
 * Persist the theme preference to localStorage.
 *
 * This function saves the theme value to localStorage using the provided storage key.
 * If localStorage is unavailable or an error occurs, the operation is silently ignored.
 *
 * @param storageKey - The localStorage key to store the theme under.
 * @param theme - The theme value to persist.
 *
 * @throws This function is client-only and will throw if called during SSR.
 */
export const setStoredTheme = createClientOnlyFn((storageKey: string, theme: Theme): void => {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // noop
  }
});

/**
 * Apply the theme to the document root element.
 *
 * This function updates the DOM to reflect the current theme by:
 * - Removing existing theme classes ('light', 'dark')
 * - Adding the new theme class or attribute
 * - Optionally setting the CSS color-scheme property for 'light' or 'dark' themes
 *
 * Supports both standard themes ('light', 'dark') and custom theme strings.
 * When using custom themes, they are applied as classes or attributes based on
 * the attribute parameter.
 *
 * @param theme - The theme to apply (can be 'light', 'dark', or a custom theme string).
 * @param attribute - The HTML attribute to apply the theme to ('class' or custom attribute name).
 * @param enableColorScheme - Whether to set the CSS color-scheme property for standard themes.
 *
 * @throws This function is client-only and will throw if called during SSR.
 */
export const applyTheme = createClientOnlyFn((theme: Theme, attribute: string, enableColorScheme: boolean): void => {
  const root = document.documentElement;

  // Remove standard theme classes
  root.classList.remove('light', 'dark');

  // Only add theme as class if it's 'light' or 'dark', otherwise apply as an attribute
  if (theme === 'light' || theme === 'dark') {
    root.classList.add(theme);
  }

  if (attribute !== 'class') {
    root.setAttribute(attribute, theme);
  } else if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    // For custom themes, add as class when the attribute is 'class'
    root.classList.add(theme);
  }

  // Only set the colorScheme for 'light' or 'dark'
  if (enableColorScheme && (theme === 'light' || theme === 'dark')) {
    root.style.colorScheme = theme;
  }
});

/**
 * React context for theme management.
 *
 * This context provides access to theme state and methods throughout the component tree.
 * Use the useTheme hook to access this context instead of using it directly.
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Generate an inline script that prevents theme flash (FOUC) by applying the theme
 * before React hydrates on the client.
 *
 * This script runs synchronously in the <head> before any other scripts execute,
 * ensuring the correct theme is applied immediately when the page loads. It reads
 * the theme from localStorage and applies it to the document root element.
 *
 * @param storageKey - The localStorage key where the theme preference is stored. Defaults to 'theme'.
 * @param attribute - The HTML attribute to apply the theme to ('class' or 'data-theme'). Defaults to 'class'.
 * @param defaultTheme - The fallback theme if no stored preference exists. Defaults to 'system'.
 * @param enableSystem - Whether to resolve 'system' theme from OS preference. Defaults to true.
 * @param enableColorScheme - Whether to set the CSS color-scheme property. Defaults to true.
 * @param forcedTheme - Force a specific theme to be applied, overriding user preferences. Defaults to undefined.
 *
 * @returns A string containing the inline JavaScript code to be injected into the <head>.
 *
 * @example
 * ```tsx
 * <head>
 *   <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
 * </head>
 * ```
 */
export function getThemeScript(
  storageKey: string = THEME_STORAGE_KEY,
  attribute: string = DEFAULT_THEME_ATTRIBUTE,
  defaultTheme: string = DEFAULT_THEME,
  enableSystem: boolean = DEFAULT_ENABLE_SYSTEM,
  enableColorScheme: boolean = DEFAULT_ENABLE_COLOR_SCHEME,
  forcedTheme?: string,
): string {
  const storageKeyEscaped = JSON.stringify(storageKey);
  const attributeEscaped = JSON.stringify(attribute);
  const defaultThemeEscaped = JSON.stringify(defaultTheme);
  const forcedThemeEscaped = forcedTheme !== undefined ? JSON.stringify(forcedTheme) : 'null';

  return `(function() {
  try {
    var storageKey = ${storageKeyEscaped};
    var attribute = ${attributeEscaped};
    var defaultTheme = ${defaultThemeEscaped};
    var enableSystem = ${enableSystem};
    var enableColorScheme = ${enableColorScheme};
    var forcedTheme = ${forcedThemeEscaped};

    // If forcedTheme is set, use it directly (highest priority)
    var currentTheme = null;
    if (forcedTheme) {
      currentTheme = forcedTheme;
    } else {
      var theme = null;
      try {
        theme = localStorage.getItem(storageKey);
      } catch (e) {}
      // Use stored theme or fallback to default theme
      currentTheme = theme || defaultTheme;
    }

    // Resolve theme based on system preference or explicit value
    var resolvedTheme = null;
    if (currentTheme === 'system' && enableSystem) {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (currentTheme === 'system') {
      resolvedTheme = 'light';
    } else {
      // Use theme as-is (supports custom theme strings)
      resolvedTheme = currentTheme;
    }

    if (resolvedTheme) {
      var root = document.documentElement;

      // Apply theme to DOM element
      if (attribute === 'class') {
        root.classList.remove('light', 'dark');
        // Add theme as class (works for 'light', 'dark', and custom themes)
        root.classList.add(resolvedTheme);
      } else {
        root.setAttribute(attribute, resolvedTheme);
      }

      // Only set colorScheme for 'light' or 'dark'
      if (enableColorScheme && (resolvedTheme === 'light' || resolvedTheme === 'dark')) {
        root.style.colorScheme = resolvedTheme;
      }
    }
  } catch (e) {}
})();`;
}

/**
 * Props for the Theme component.
 */
export type ThemeProps = {
  /** Child components that will have access to the theme context. */
  children: ReactNode;
  /** The HTML attribute to apply the theme to ('class' or 'data-theme'). Defaults to 'class'. */
  attribute?: string;
  /** The default theme to use when no stored preference exists. Defaults to 'system'. */
  defaultTheme?: Theme;
  /** Whether to enable system theme detection. Defaults to true. */
  enableSystem?: boolean;
  /** Whether to disable CSS transitions when changing themes to prevent flash. Defaults to false. */
  disableTransitionOnChange?: boolean;
  /** Whether to set the CSS color-scheme property. Defaults to true. */
  enableColorScheme?: boolean;
  /** The localStorage key to store the theme preference. Defaults to 'theme'. */
  storageKey?: string;
  /** Force a specific theme to be applied, overriding user preferences and stored settings. */
  forcedTheme?: Theme;
};

/**
 * Theme provider component that manages theme state and applies it to the DOM.
 *
 * This component handles:
 * - Reading and persisting theme preferences from localStorage
 * - Detecting and responding to system theme changes
 * - Applying the theme to the document root element
 * - Synchronizing theme changes across browser tabs via storage events
 * - Providing theme state and control methods via context
 * - Forcing a specific theme when forcedTheme prop is provided
 *
 * The component only initializes and applies themes after hydration to prevent
 * hydration mismatches between server and client.
 *
 * @param props - The theme configuration props.
 *
 * @returns A ThemeContext.Provider wrapping the children with theme state.
 *
 * @example
 * ```tsx
 * <Theme defaultTheme="dark" enableSystem={true}>
 *   <App />
 * </Theme>
 * ```
 *
 * @example
 * ```tsx
 * <Theme forcedTheme="dark">
 *   <App />
 * </Theme>
 * ```
 */
export function Theme({
  children,
  attribute = DEFAULT_THEME_ATTRIBUTE,
  defaultTheme = DEFAULT_THEME,
  enableSystem = DEFAULT_ENABLE_SYSTEM,
  disableTransitionOnChange = false,
  storageKey = THEME_STORAGE_KEY,
  enableColorScheme = DEFAULT_ENABLE_COLOR_SCHEME,
  forcedTheme,
}: ThemeProps): JSX.Element {
  const hydrated = useHydrated();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<SystemTheme | undefined>(undefined);

  const handleSystemThemeChange = useEffectEvent((e: MediaQueryListEvent) => {
    setSystemTheme(e.matches ? 'dark' : 'light');
  });

  const applyThemeToDOM = useEffectEvent((resolvedTheme: Theme) => {
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}',
        ),
      );
      document.head.appendChild(css);

      applyTheme(resolvedTheme, attribute, enableColorScheme);

      (() => window.getComputedStyle(document.body))();

      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    } else {
      applyTheme(resolvedTheme, attribute, enableColorScheme);
    }
  });

  const initializeTheme = useEffectEvent(() => {
    const stored = getStoredTheme(storageKey);
    const initialTheme = stored || defaultTheme;
    setThemeState(initialTheme);

    if (enableSystem) {
      const initialSystemTheme = getSystemTheme();
      setSystemTheme(initialSystemTheme);
    }
  });

  const handleStorageChange = useEffectEvent((storageEvent: StorageEvent) => {
    // Don't respond to storage changes when forcedTheme is set
    if (forcedTheme) {
      return;
    }
    if (storageEvent.key === storageKey && storageEvent.newValue) {
      const newTheme = storageEvent.newValue;
      setThemeState(newTheme);
    }
  });

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    initializeTheme();
  }, [hydrated, storageKey, defaultTheme, enableSystem]);

  useEffect(() => {
    if (!hydrated || !enableSystem) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [hydrated, enableSystem]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    // If forcedTheme is set, use it directly (the highest priority)
    if (forcedTheme) {
      // Resolve forcedTheme if it's 'system'
      const resolvedForcedTheme: Theme =
        forcedTheme === 'system' && enableSystem
          ? (systemTheme ?? 'light')
          : forcedTheme === 'system'
            ? 'light'
            : forcedTheme;
      applyThemeToDOM(resolvedForcedTheme);
      return;
    }

    // Resolve theme: 'system' -> systemTheme or 'light', otherwise use theme as-is (including custom strings)
    const resolved: Theme =
      theme === 'system' && enableSystem ? (systemTheme ?? 'light') : theme === 'system' ? 'light' : theme;

    applyThemeToDOM(resolved);
  }, [
    theme,
    systemTheme,
    hydrated,
    enableSystem,
    attribute,
    enableColorScheme,
    disableTransitionOnChange,
    forcedTheme,
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [hydrated, forcedTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!hydrated) {
        return;
      }

      // Don't allow theme changes when forcedTheme is set
      if (forcedTheme) {
        return;
      }

      setThemeState(newTheme);
      setStoredTheme(storageKey, newTheme);
    },
    [hydrated, storageKey, forcedTheme],
  );

  const resolvedTheme = useMemo(() => {
    if (!hydrated) {
      return undefined;
    }
    // If forcedTheme is set, resolve it (the highest priority)
    if (forcedTheme) {
      if (forcedTheme === 'system' && enableSystem) {
        return systemTheme ?? undefined;
      }
      return forcedTheme === 'system' ? 'light' : forcedTheme;
    }
    // Otherwise, resolve the normal theme
    if (theme === 'system' && enableSystem) {
      return systemTheme ?? undefined;
    }
    return theme === 'system' ? 'light' : theme;
  }, [theme, systemTheme, hydrated, enableSystem, forcedTheme]);

  const themes: Theme[] = enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'];

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    themes,
    systemTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the theme context and get theme state and control methods.
 *
 * This hook provides access to the theme context value, including the current
 * theme, resolved theme, system theme, available themes, and the setTheme function.
 *
 * @returns The theme context value containing theme state and methods.
 *
 * @throws {Error} If called outside of a ThemeProvider component.
 *
 * @example
 * ```tsx
 * function ThemeSwitcher() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *       Current: {resolvedTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

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
