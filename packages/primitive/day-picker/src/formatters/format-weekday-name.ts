import { DateLib, type DateLibOptions } from '@/classes/date-lib';

/**
 * Format the weekday name to be displayed in the weekdays header.
 *
 * @defaultValue `cccccc` (e.g. "Mo" for Monday)
 */
export function formatWeekdayName(weekday: Date, options?: DateLibOptions, dateLib?: DateLib) {
  return (dateLib ?? new DateLib(options)).format(weekday, 'cccccc');
}