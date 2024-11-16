import { type DateFnsMonth, defaultLocale } from '@/lib/classes/date-lib';

/**
 * Format the month number for the dropdown option label.
 *
 * @defaultValue The localized month name
 */
export function formatMonthDropdown(
  /**
   * The month number to format.
   */
  monthNumber: number,

  /**
   * The locale to use for formatting.
   */
  locale = defaultLocale,
): string {
  return locale.localize.month(monthNumber as DateFnsMonth);
}
