import type { DayPickerProps, Formatters } from '@/lib/types';

import * as defaultFormatters from '@/lib/formatters';

/**
 * Return the formatters from the props merged with the default formatters.
 */
export function getFormatters(customFormatters?: DayPickerProps['formatters']): Formatters {
  if (!customFormatters) {
    return defaultFormatters;
  }

  return {
    ...defaultFormatters,
    ...customFormatters,
  };
}
