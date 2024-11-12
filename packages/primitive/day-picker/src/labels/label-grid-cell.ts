import { DateLib, type DateLibOptions } from '@/classes/date-lib';
import { type Modifiers } from '@/types';

/**
 * The label for the day gridcell when the calendar is not interactive.
 *
 */
export function labelGridCell(
  date: Date,
  /** The modifiers for the day. */
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
