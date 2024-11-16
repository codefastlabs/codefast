import { DateLib, type DateLibOptions } from '@/lib/classes/date-lib';

/**
 * Format the caption of the month.
 *
 * @defaultValue `LLLL y` (e.g. "November 2022")
 */
export function formatCaption(month: Date, options?: DateLibOptions, dateLib?: DateLib): string {
  return (dateLib ?? new DateLib(options)).format(month, 'LLLL y');
}
