import { DateLib, type DateLibOptions } from '@/lib/classes/date-lib';
import { type Modifiers } from '@/lib/types';

/**
 * The ARIA label for the day button.
 *
 * Use the `modifiers` argument to add additional context to the label, e.g.
 * when a day is selected or is today.
 *
 * @defaultValue The formatted date.
 */
export function labelDayButton(
  date: Date,
  /** The modifiers for the day. */
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

/** @deprecated Use `labelDayButton` instead. */
export const labelDay = labelDayButton;
