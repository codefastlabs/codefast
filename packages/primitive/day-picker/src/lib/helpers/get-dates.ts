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
  const lastMonth = displayMonths[displayMonths.length - 1];

  const { ISOWeek, fixedWeeks, broadcastCalendar } = props;

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

  const startWeekFirstDate = broadcastCalendar
    ? startOfBroadcastWeek(firstMonth, dateLib)
    : ISOWeek
      ? startOfISOWeek(firstMonth)
      : startOfWeek(firstMonth);

  const endWeekLastDate = broadcastCalendar
    ? endOfBroadcastWeek(lastMonth, dateLib)
    : ISOWeek
      ? endOfISOWeek(endOfMonth(lastMonth))
      : endOfWeek(endOfMonth(lastMonth));

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
      const date = addDays(dates[dates.length - 1], 1);

      dates.push(date);
    }
  }

  return dates;
}
