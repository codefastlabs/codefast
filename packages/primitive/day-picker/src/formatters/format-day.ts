import { DateLib, type DateLibOptions } from '@/classes/date-lib';

/**
 * Format the day date shown in the day cell.
 *
 * @defaultValue `d` (e.g. "1")
 */
export function formatDay(date: Date, options?: DateLibOptions, dateLib?: DateLib) {
  return (dateLib ?? new DateLib(options)).format(date, 'd');
}
