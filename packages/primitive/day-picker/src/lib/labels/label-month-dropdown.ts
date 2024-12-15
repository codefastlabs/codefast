import type { DateLibOptions } from '@/lib/classes/date-lib';

/**
 * The ARIA label for the months dropdown.
 *
 * @defaultValue `"Choose the Month"`
 */
export function labelMonthDropdown(_options?: DateLibOptions): string {
  return 'Choose the Month';
}
