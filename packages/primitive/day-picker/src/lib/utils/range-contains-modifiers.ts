import type { DateLib } from '@/lib/classes/date-lib';
import type { Matcher } from '@/lib/types';

import { defaultDateLib } from '@/lib/classes/date-lib';
import { dateMatchModifiers } from '@/lib/utils/date-match-modifiers';
import { rangeContainsDayOfWeek } from '@/lib/utils/range-contains-day-of-week';
import { rangeIncludesDate } from '@/lib/utils/range-includes-date';
import { rangeOverlaps } from '@/lib/utils/range-overlaps';
import {
  isDateAfterType,
  isDateBeforeType,
  isDateInterval,
  isDateRange,
  isDatesArray,
  isDayOfWeekType,
} from '@/lib/utils/typeguards';

/**
 * Returns whether a range contains dates that match the given modifiers.
 *
 * ```tsx
 * const range: DateRange = {
 *   from: new Date(2021, 12, 21),
 *   to: new Date(2021, 12, 30)
 * };
 * const matcher1: Date = new Date(2021, 12, 21);
 * const matcher2: DateRange = {
 *   from: new Date(2022, 5, 1),
 *   to: new Date(2022, 5, 23)
 * };
 * rangeContainsModifiers(range, [matcher1, matcher2]); // true, since matcher1 is in the date.
 * ```
 */
export function rangeContainsModifiers(
  range: { from: Date; to: Date },
  modifiers: Matcher | Matcher[],
  dateLib: DateLib = defaultDateLib,
): boolean {
  const matchers = Array.isArray(modifiers) ? modifiers : [modifiers];

  // Defer function matchers evaluation as they are the least performant.
  const nonFunctionMatchers = matchers.filter((matcher) => typeof matcher !== 'function');

  const nonFunctionMatchersResult = nonFunctionMatchers.some((matcher) => {
    if (typeof matcher === 'boolean') {
      return matcher;
    }

    if (dateLib.isDate(matcher)) {
      return rangeIncludesDate(range, matcher, false, dateLib);
    }

    if (isDatesArray(matcher, dateLib)) {
      return matcher.some((date) => rangeIncludesDate(range, date, false, dateLib));
    }

    if (isDateRange(matcher)) {
      if (matcher.from && matcher.to) {
        return rangeOverlaps(range, { from: matcher.from, to: matcher.to }, dateLib);
      }

      return false;
    }

    if (isDayOfWeekType(matcher)) {
      return rangeContainsDayOfWeek(range, matcher.dayOfWeek, dateLib);
    }

    if (isDateInterval(matcher)) {
      const isClosedInterval = dateLib.isAfter(matcher.before, matcher.after);

      if (isClosedInterval) {
        return rangeOverlaps(
          range,
          {
            from: dateLib.addDays(matcher.after, 1),
            to: dateLib.addDays(matcher.before, -1),
          },
          dateLib,
        );
      }

      return dateMatchModifiers(range.from, matcher, dateLib) || dateMatchModifiers(range.to, matcher, dateLib);
    }

    if (isDateAfterType(matcher) || isDateBeforeType(matcher)) {
      return dateMatchModifiers(range.from, matcher, dateLib) || dateMatchModifiers(range.to, matcher, dateLib);
    }

    return false;
  });

  if (nonFunctionMatchersResult) {
    return true;
  }

  const functionMatchers = matchers.filter((matcher) => typeof matcher === 'function');

  if (functionMatchers.length > 0) {
    let date = range.from;
    const totalDays = dateLib.differenceInCalendarDays(range.to, range.from);

    const isMatch = (currentDate: Date): boolean => functionMatchers.some((matcher) => matcher(currentDate));

    for (let i = 0; i <= totalDays; i++) {
      if (isMatch(date)) {
        return true;
      }

      date = dateLib.addDays(date, 1);
    }
  }

  return false;
}
