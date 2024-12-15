import type { DateLibOptions } from '@/lib/classes/date-lib';

/**
 * The ARIA label for the week number cell (the first cell in the row).
 *
 * @defaultValue `Week ${weekNumber}`
 */
export function labelWeekNumber(weekNumber: number, _options?: DateLibOptions): string {
  return `Week ${weekNumber}`;
}
