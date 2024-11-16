import * as defaultFormatters from '@/lib/formatters';
import { type DayPickerProps, type Formatters } from '@/lib/types';

/**
 * Return the formatters from the props merged with the default formatters.
 */
export function getFormatters(customFormatters: DayPickerProps['formatters']): Formatters {
  return {
    ...defaultFormatters,
    ...customFormatters,
  };
}
