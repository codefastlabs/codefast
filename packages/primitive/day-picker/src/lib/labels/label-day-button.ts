import { type DateLibOptions, DateLib } from '@/lib/classes/date-lib';
import { type Modifiers } from '@/lib/types';

/**
 * Generates a label for a day button based on the given date and modifiers.
 *
 * @param date - The date to be formatted.
 * @param modifiers - The modifiers for the day.
 * @param options - (Optional) Configuration options for the DateLib library.
 * @param dateLib - (Optional) A custom DateLib instance to use for date formatting.
 * @returns The formatted label for the day button.
 */
export function labelDayButton(
  date: Date,
  /**
   * The modifiers for the day.
   */
  modifiers: Modifiers,
  options?: DateLibOptions,
  dateLib?: DateLib,
): string {
  let label = (dateLib ?? new DateLib(options)).format(date, 'PPPP');

  if (modifiers.today) {
    label = `Today, ${label}`;
  }

  if (modifiers.selected) {
    label = `${label}, selected`;
  }

  return label;
}
