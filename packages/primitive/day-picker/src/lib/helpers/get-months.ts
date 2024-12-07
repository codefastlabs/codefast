import { CalendarDay, CalendarMonth, CalendarWeek } from '@/lib/classes';
import { type DateLib } from '@/lib/classes/date-lib';
import { NrOfDaysBroadcast, NrOfDaysWithFixedWeeks } from '@/lib/helpers/get-dates';
import { type DayPickerProps } from '@/lib/types';

/**
 * Return the months to display in the calendar.
 */
export function getMonths(
  /**
   * The months (as dates) to display in the calendar.
   */
  displayMonths: Date[],

  /**
   * The dates to display in the calendar.
   */
  dates: Date[],

  /**
   * Options from the props context.
   */
  props: Pick<DayPickerProps, 'broadcastCalendar' | 'fixedWeeks' | 'ISOWeek' | 'reverseMonths'>,
  dateLib: DateLib,
): CalendarMonth[] {
  const {
    addDays,
    endOfBroadcastWeek,
    endOfISOWeek,
    endOfMonth,
    endOfWeek,
    getISOWeek,
    getWeek,
    startOfBroadcastWeek,
    startOfISOWeek,
    startOfWeek,
  } = dateLib;
  const dayPickerMonths: CalendarMonth[] = [];

  for (const month of displayMonths) {
    let firstDateOfFirstWeek: Date;

    if (props.broadcastCalendar) {
      firstDateOfFirstWeek = startOfBroadcastWeek(month, dateLib);
    } else if (props.ISOWeek) {
      firstDateOfFirstWeek = startOfISOWeek(month);
    } else {
      firstDateOfFirstWeek = startOfWeek(month);
    }

    let lastDateOfLastWeek: Date;

    if (props.broadcastCalendar) {
      lastDateOfLastWeek = endOfBroadcastWeek(month, dateLib);
    } else if (props.ISOWeek) {
      lastDateOfLastWeek = endOfISOWeek(endOfMonth(month));
    } else {
      lastDateOfLastWeek = endOfWeek(endOfMonth(month));
    }

    const monthDates = dates.filter((date) => {
      return date >= firstDateOfFirstWeek && date <= lastDateOfLastWeek;
    });

    const nrOfDaysWithFixedWeeks = props.broadcastCalendar ? NrOfDaysBroadcast : NrOfDaysWithFixedWeeks;

    if (props.fixedWeeks && monthDates.length < nrOfDaysWithFixedWeeks) {
      const extraDates = dates.filter((date) => {
        const daysToAdd = nrOfDaysWithFixedWeeks - monthDates.length;

        return date > lastDateOfLastWeek && date <= addDays(lastDateOfLastWeek, daysToAdd);
      });

      monthDates.push(...extraDates);
    }

    const weeks: CalendarWeek[] = [];

    for (const date of monthDates) {
      const weekNumber = props.ISOWeek ? getISOWeek(date) : getWeek(date);
      const week = weeks.find((currentWeek) => currentWeek.weekNumber === weekNumber);
      const day = new CalendarDay(date, month, dateLib);

      if (week) {
        week.days.push(day);
      } else {
        weeks.push(new CalendarWeek(weekNumber, [day]));
      }
    }

    const dayPickerMonth = new CalendarMonth(month, weeks);

    dayPickerMonths.push(dayPickerMonth);
  }

  if (!props.reverseMonths) {
    return dayPickerMonths;
  }

  return dayPickerMonths.reverse();
}
