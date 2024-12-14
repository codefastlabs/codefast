import { TZDate } from '@date-fns/tz';

import { type DateLib } from '@/lib/classes/date-lib';
import { type DayPickerProps } from '@/lib/types';

const YEARS_OFFSET = 100;

/**
 * Return the start and end months for the calendar navigation.
 */
export function getNavMonths(
  props: Pick<DayPickerProps, 'captionLayout' | 'endMonth' | 'startMonth' | 'timeZone' | 'today'>,
  dateLib: DateLib,
): [start: Date | undefined, end: Date | undefined] {
  const { addYears, endOfMonth, endOfYear, startOfDay, startOfMonth, startOfYear } = dateLib;

  // Extract props
  let { endMonth, startMonth } = props;
  const { captionLayout, timeZone, today } = props;

  const hasDropdowns = captionLayout?.startsWith('dropdown');
  const currentToday = today ?? (timeZone ? TZDate.tz(timeZone) : new dateLib.Date());

  // Handle defaults for dropdown layout
  if (hasDropdowns) {
    startMonth = startMonth || startOfYear(addYears(currentToday, -YEARS_OFFSET));
    endMonth = endMonth || endOfYear(currentToday);
  }

  // Ensure months are properly rounded
  const roundedStart = startMonth ? startOfDay(startOfMonth(startMonth)) : undefined;
  const roundedEnd = endMonth ? startOfDay(endOfMonth(endMonth)) : undefined;

  return [roundedStart, roundedEnd];
}
