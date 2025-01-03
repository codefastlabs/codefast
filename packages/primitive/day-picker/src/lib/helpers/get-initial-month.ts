import { TZDate } from '@date-fns/tz';

import type { DateLib } from '@/lib/classes/date-lib';
import type { DayPickerProps } from '@/lib/types';

/**
 * Return the start month based on the props passed to DayPicker.
 */
export function getInitialMonth(
  props: Pick<
    DayPickerProps,
    'defaultMonth' | 'endMonth' | 'month' | 'numberOfMonths' | 'startMonth' | 'timeZone' | 'today'
  >,
  dateLib: DateLib,
): Date {
  const {
    defaultMonth,
    endMonth,
    month,
    numberOfMonths = 1,
    startMonth,
    today = props.timeZone ? TZDate.tz(props.timeZone) : new dateLib.Date(),
  } = props;
  let initialMonth = month || defaultMonth || today;
  const { addMonths, differenceInCalendarMonths, startOfMonth } = dateLib;

  // Fix the initialMonth if is after the to-date
  if (endMonth && differenceInCalendarMonths(endMonth, initialMonth) < 0) {
    const offset = -1 * (numberOfMonths - 1);

    initialMonth = addMonths(endMonth, offset);
  }

  // Fix the initialMonth if is before the from-date
  if (startMonth && differenceInCalendarMonths(initialMonth, startMonth) < 0) {
    initialMonth = startMonth;
  }

  return startOfMonth(initialMonth);
}
