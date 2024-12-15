import type { DateLibOptions } from '@/lib/classes/date-lib';
import type { Modifiers } from '@/lib/types';

import { DateLib } from '@/lib/classes/date-lib';

/**
 * The label for the day gridcell when the calendar is not interactive.
 */
export function labelGridcell(
  date: Date,
  /**
   * The modifiers for the day.
   */
  modifiers?: Modifiers,
  options?: DateLibOptions,
  dateLib?: DateLib,
): string {
  let label = (dateLib ?? new DateLib(options)).format(date, 'PPPP');

  if (modifiers?.today) {
    label = `Today, ${label}`;
  }

  return label;
}
