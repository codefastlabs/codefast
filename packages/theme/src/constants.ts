import type { ResolvedTheme, Theme } from '@/types';

/* -----------------------------------------------------------------------------
 * Constants (Public)
 * -------------------------------------------------------------------------- */

/**
 * Default theme used when no preference is set.
 * @public
 */
export const DEFAULT_THEME: Theme = 'system';

/**
 * Default resolved theme used for server-side rendering when 'system' cannot be determined.
 * @public
 */
export const DEFAULT_RESOLVED_THEME: ResolvedTheme = 'dark';

/**
 * Cookie storage key for persisting theme preference.
 * @public
 */
export const THEME_STORAGE_KEY = 'ui-theme';

/* -----------------------------------------------------------------------------
 * Constants (Internal)
 * -------------------------------------------------------------------------- */

/**
 * Media query for detecting dark mode preference.
 * @internal
 */
export const MEDIA = '(prefers-color-scheme: dark)';

/**
 * BroadcastChannel name for cross-tab theme synchronization.
 * @internal
 */
export const THEME_CHANNEL = 'theme-sync';
