import type { DateRange } from '@/lib/types';

import { defaultDateLib } from '@/lib/classes';

/**
 * Determines if a given date is within a specified date range.
 *
 * @param range - The range of dates with a 'from' and 'to' date.
 * @param date - The date to check if it is within the range.
 * @param excludeEnds - Optional flag indicating if the ends of the range should be excluded (default is false).
 * @param dateLib - Optional date manipulation library; defaults to 'defaultDateLib'.
 *
 * @returns True if the date is within the range (considering the optional excludeEnds flag), otherwise false.
 */
export function rangeIncludesDate(
  range: DateRange,
  date: Date,
  /**
   *  If `true`, the ends of the range are excluded.
   */
  excludeEnds = false,
  dateLib = defaultDateLib,
): boolean {
  let { from, to } = range;
  const { differenceInCalendarDays, isSameDay } = dateLib;

  if (from && to) {
    const isRangeInverted = differenceInCalendarDays(to, from) < 0;

    if (isRangeInverted) {
      [from, to] = [to, from];
    }

    return (
      differenceInCalendarDays(date, from) >= (excludeEnds ? 1 : 0) &&
      differenceInCalendarDays(to, date) >= (excludeEnds ? 1 : 0)
    );
  }

  if (!excludeEnds && to) {
    return isSameDay(to, date);
  }

  if (!excludeEnds && from) {
    return isSameDay(from, date);
  }

  return false;
}
