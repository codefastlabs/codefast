import type { DateLib } from '@/lib/classes/date-lib';
import type { Matcher } from '@/lib/types';

import { defaultDateLib } from '@/lib/classes/date-lib';
import { rangeIncludesDate } from '@/lib/utils/range-includes-date';
import {
  isDateAfterType,
  isDateBeforeType,
  isDateInterval,
  isDateRange,
  isDatesArray,
  isDayOfWeekType,
} from '@/lib/utils/typeguards';

/**
 * Returns whether a day matches against at least one of the given
 * {@link Matcher}.
 *
 * ```tsx
 * const date = new Date(2022, 5, 19);
 * const matcher1: DateRange = {
 *   from: new Date(2021, 12, 21),
 *   to: new Date(2021, 12, 30)
 * };
 * const matcher2: DateRange = {
 *   from: new Date(2022, 5, 1),
 *   to: new Date(2022, 5, 23)
 * };
 * dateMatchModifiers(date, [matcher1, matcher2]); // true, since day is in the matcher1 range.
 * ```
 */
export function dateMatchModifiers(
  date: Date,
  matchers: Matcher | Matcher[],
  dateLib: DateLib = defaultDateLib,
): boolean {
  const matchersArr = Array.isArray(matchers) ? matchers : [matchers];
  const { differenceInCalendarDays, isAfter, isSameDay } = dateLib;

  return matchersArr.some((matcher: Matcher) => {
    if (typeof matcher === 'boolean') {
      return matcher;
    }

    if (dateLib.isDate(matcher)) {
      return isSameDay(date, matcher);
    }

    if (isDatesArray(matcher, dateLib)) {
      return matcher.includes(date);
    }

    if (isDateRange(matcher)) {
      return rangeIncludesDate(matcher, date, false, dateLib);
    }

    if (isDayOfWeekType(matcher)) {
      if (!Array.isArray(matcher.dayOfWeek)) {
        return matcher.dayOfWeek === date.getDay();
      }

      return matcher.dayOfWeek.includes(date.getDay());
    }

    if (isDateInterval(matcher)) {
      const diffBefore = differenceInCalendarDays(matcher.before, date);
      const diffAfter = differenceInCalendarDays(matcher.after, date);
      const isDayBefore = diffBefore > 0;
      const isDayAfter = diffAfter < 0;
      const isClosedInterval = isAfter(matcher.before, matcher.after);

      if (isClosedInterval) {
        return isDayAfter && isDayBefore;
      }

      return isDayBefore || isDayAfter;
    }

    if (isDateAfterType(matcher)) {
      return differenceInCalendarDays(date, matcher.after) > 0;
    }

    if (isDateBeforeType(matcher)) {
      return differenceInCalendarDays(matcher.before, date) > 0;
    }

    if (typeof matcher === 'function') {
      return matcher(date);
    }

    return false;
  });
}
