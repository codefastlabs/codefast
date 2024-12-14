import { type DateLibOptions, DateLib } from '@/lib/classes/date-lib';

/**
 * Format the weekday name to be displayed in the weekdays header.
 *
 * @defaultValue `cccccc` (e.g., "Mo" for Monday)
 */
export function formatWeekdayName(weekday: Date, options?: DateLibOptions, dateLib?: DateLib): string {
  return (dateLib ?? new DateLib(options)).format(weekday, 'cccccc');
}
