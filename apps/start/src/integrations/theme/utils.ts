import { createClientOnlyFn } from '@tanstack/react-start';
import type { SystemTheme, Theme } from '@/integrations/theme/types';

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
