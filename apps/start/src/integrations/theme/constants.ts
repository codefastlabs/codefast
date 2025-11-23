import type { Theme } from '@/integrations/theme/types';

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
