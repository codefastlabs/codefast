import { DateLib, type DateLibOptions } from '@/classes/date-lib';

/**
 * Return an ARIA label for the month grid, that will be announced when entering
 * the grid.
 *
 * @defaultValue `LLLL y` (e.g. "November 2022")
 */
export function labelGrid(date: Date, options?: DateLibOptions, dateLib?: DateLib): string {
  return (dateLib ?? new DateLib(options)).format(date, 'LLLL y');
}

/**
 * @deprecated Use {@link labelGrid} instead.
 */
export const labelCaption = labelGrid;
