import { type DateLib } from '@/lib/classes/date-lib';
import { type DayPickerProps } from '@/lib/types';

/**
 * The number of days in a month when having 6 weeks.
 */
export const NrOfDaysWithFixedWeeks = 42;
export const NrOfDaysBroadcast = 35;

/**
 * Return all the dates to display in the calendar.
 */
export function getDates(
  displayMonths: Date[],
  maxDate: Date | undefined,
  props: Pick<DayPickerProps, 'ISOWeek' | 'fixedWeeks' | 'broadcastCalendar'>,
  dateLib: DateLib,
): Date[] {
  const firstMonth = displayMonths[0];
  // eslint-disable-next-line unicorn/prefer-at -- we need the last element
  const lastMonth = displayMonths[displayMonths.length - 1];

  const { broadcastCalendar, fixedWeeks, ISOWeek } = props;

  const {
    addDays,
    differenceInCalendarDays,
    differenceInCalendarMonths,
    endOfBroadcastWeek,
    endOfISOWeek,
    endOfMonth,
    endOfWeek,
    isAfter,
    startOfBroadcastWeek,
    startOfISOWeek,
    startOfWeek,
  } = dateLib;

  let startWeekFirstDate: Date;

  if (broadcastCalendar) {
    startWeekFirstDate = startOfBroadcastWeek(firstMonth, dateLib);
  } else if (ISOWeek) {
    startWeekFirstDate = startOfISOWeek(firstMonth);
  } else {
    startWeekFirstDate = startOfWeek(firstMonth);
  }

  let endWeekLastDate: Date;

  if (broadcastCalendar) {
    endWeekLastDate = endOfBroadcastWeek(lastMonth, dateLib);
  } else if (ISOWeek) {
    endWeekLastDate = endOfISOWeek(endOfMonth(lastMonth));
  } else {
    endWeekLastDate = endOfWeek(endOfMonth(lastMonth));
  }

  const nOfDays = differenceInCalendarDays(endWeekLastDate, startWeekFirstDate);
  const nOfMonths = differenceInCalendarMonths(lastMonth, firstMonth) + 1;

  const dates: Date[] = [];

  for (let i = 0; i <= nOfDays; i++) {
    const date = addDays(startWeekFirstDate, i);

    if (maxDate && isAfter(date, maxDate)) {
      break;
    }

    dates.push(date);
  }

  // If fixed weeks are enabled, add the extra dates to the array
  const nrOfDaysWithFixedWeeks = broadcastCalendar ? NrOfDaysBroadcast : NrOfDaysWithFixedWeeks;
  const extraDates = nrOfDaysWithFixedWeeks * nOfMonths;

  if (fixedWeeks && dates.length < extraDates) {
    const daysToAdd = extraDates - dates.length;

    for (let i = 0; i < daysToAdd; i++) {
      // eslint-disable-next-line unicorn/prefer-at -- we need the last element
      const date = addDays(dates[dates.length - 1], 1);

      dates.push(date);
    }
  }

  return dates;
}
