import type { DateLib } from '@/lib/classes/date-lib';
import type { DayPickerProps } from '@/lib/types';

/**
 * Gets an array of dates representing the months to be displayed in a calendar.
 *
 * @param firstDisplayedMonth - The starting month to be displayed.
 * @param calendarEndMonth - Optional; The ending month for the calendar display. If specified, the calculation stops
 *   if a month exceeds this date.
 * @param props - Properties containing the number of months to display.
 * @param dateLib - A date library providing date manipulation functions.
 * @returns An array of dates representing the months to be displayed.
 */
export function getDisplayMonths(
  firstDisplayedMonth: Date,
  calendarEndMonth: Date | undefined,
  props: Pick<DayPickerProps, 'numberOfMonths'>,
  dateLib: DateLib,
): Date[] {
  const { numberOfMonths = 1 } = props;
  const months: Date[] = [];

  for (let i = 0; i < numberOfMonths; i++) {
    const month = dateLib.addMonths(firstDisplayedMonth, i);

    if (calendarEndMonth && month > calendarEndMonth) {
      break;
    }

    months.push(month);
  }

  return months;
}
