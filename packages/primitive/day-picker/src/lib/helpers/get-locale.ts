import { type Locale } from 'date-fns/locale';

import { type DayPickerProps } from '@/lib';
import { defaultLocale } from '@/lib/classes/date-lib';

/**
 * Merges the provided locale with the default locale settings.
 *
 * @param locale - A partial locale configuration to be merged with the default.
 * @returns The merged locale configuration.
 */
export function getLocale(locale: DayPickerProps['locale']): Locale {
  return {
    ...defaultLocale,
    ...locale,
  };
}
