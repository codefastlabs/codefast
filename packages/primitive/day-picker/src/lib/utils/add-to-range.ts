import type { DateLib } from '@/lib/classes/date-lib';
import type { DateRange } from '@/lib/types';

import { defaultDateLib } from '@/lib/classes/date-lib';

/**
 * Add a day to an existing range.
 *
 * The returned range takes in an account the `undefined` values, and if the added day is already present in the range.
 */
export function addToRange(
  /**
   * The date to add to the range.
   */
  date: Date,

  /**
   * The range where to add `date`.
   */
  initialRange?: DateRange,
  min = 0,
  max = 0,
  required = false,
  dateLib: DateLib = defaultDateLib,
): DateRange | undefined {
  const { from, to } = initialRange || {};
  const { isAfter, isBefore, isSameDay } = dateLib;

  let range: DateRange | undefined;

  if (!from && !to) {
    // the range is empty, add the date
    range = { from: date, to: min > 0 ? undefined : date };
  } else if (from && !to) {
    // adding date to an incomplete range
    if (isSameDay(from, date)) {
      // adding a date equal to the start of the range
      range = required ? { from, to: undefined } : undefined;
    } else if (isBefore(date, from)) {
      // adding a date before the start of the range
      range = { from: date, to: from };
    } else {
      // adding a date after the start of the range
      range = { from, to: date };
    }
  } else if (from && to) {
    // adding date to a complete range
    if (isSameDay(from, date) && isSameDay(to, date)) {
      // adding a date that is equal to both start and end of the range
      range = required ? { from, to } : undefined;
    } else if (isSameDay(from, date)) {
      // adding a date equal to the start of the range
      range = { from, to: min > 0 ? undefined : date };
    } else if (isSameDay(to, date)) {
      // adding a dare equal to the end of the range
      range = { from: date, to: min > 0 ? undefined : date };
    } else if (isBefore(date, from)) {
      // adding a date before the start of the range
      range = { from: date, to };
    } else if (isAfter(date, from)) {
      // adding a date after the start of the range
      range = { from, to: date };
    } else if (isAfter(date, to)) {
      // adding a date after the end of the range
      range = { from, to: date };
    } else {
      throw new Error('Invalid range');
    }
  }

  // check for min / max
  if (range?.from && range.to) {
    const diff = dateLib.differenceInCalendarDays(range.to, range.from);

    if (max > 0 && diff > max) {
      range = { from: date, to: undefined };
    } else if (min > 1 && diff < min) {
      range = { from: date, to: undefined };
    }
  }

  return range;
}
