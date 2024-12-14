import { type DateLib } from '@/lib/classes/date-lib';
import { type DayPickerProps } from '@/lib/types';

/**
 * Return the next previous the user can navigate to, according to the given
 * options.
 *
 * Please note that the previous month is not always the previous calendar
 * month:
 *
 * - If before the `calendarStartMonth` date, is `undefined`;
 * - If the navigation is paged, is the number of months displayed before.
 */
export function getPreviousMonth(
  firstDisplayedMonth: Date,
  calendarStartMonth: Date | undefined,
  options: Pick<DayPickerProps, 'disableNavigation' | 'numberOfMonths' | 'pagedNavigation'>,
  dateLib: DateLib,
): Date | undefined {
  if (options.disableNavigation) {
    return undefined;
  }

  const { numberOfMonths, pagedNavigation } = options;
  const { addMonths, differenceInCalendarMonths, startOfMonth } = dateLib;
  const offset = pagedNavigation ? (numberOfMonths ?? 1) : 1;
  const month = startOfMonth(firstDisplayedMonth);

  if (!calendarStartMonth) {
    return addMonths(month, -offset);
  }

  const monthsDiff = differenceInCalendarMonths(month, calendarStartMonth);

  if (monthsDiff <= 0) {
    return undefined;
  }

  return addMonths(month, -offset);
}
