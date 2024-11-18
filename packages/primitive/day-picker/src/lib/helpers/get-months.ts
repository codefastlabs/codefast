import { CalendarDay, CalendarMonth, CalendarWeek } from '@/lib/classes';
import { type DateLib } from '@/lib/classes/date-lib';
import { NrOfDaysWithFixedWeeks } from '@/lib/helpers/get-dates';
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
  props: Pick<DayPickerProps, 'fixedWeeks' | 'ISOWeek' | 'reverseMonths'>,
  dateLib: DateLib,
): CalendarMonth[] {
  const { startOfWeek, endOfWeek, startOfISOWeek, endOfISOWeek, endOfMonth, addDays, getWeek, getISOWeek } = dateLib;
  const dayPickerMonths = displayMonths.reduce<CalendarMonth[]>((months, month) => {
    const firstDateOfFirstWeek = props.ISOWeek ? startOfISOWeek(month) : startOfWeek(month);

    const lastDateOfLastWeek = props.ISOWeek ? endOfISOWeek(endOfMonth(month)) : endOfWeek(endOfMonth(month));

    /**
     * The dates to display in the month.
     */
    const monthDates = dates.filter((date) => {
      return date >= firstDateOfFirstWeek && date <= lastDateOfLastWeek;
    });

    if (props.fixedWeeks && monthDates.length < NrOfDaysWithFixedWeeks) {
      const extraDates = dates.filter((date) => {
        const daysToAdd = NrOfDaysWithFixedWeeks - monthDates.length;

        return date > lastDateOfLastWeek && date <= addDays(lastDateOfLastWeek, daysToAdd);
      });

      monthDates.push(...extraDates);
    }

    const weeks: CalendarWeek[] = monthDates.reduce<CalendarWeek[]>((weeksAcc, date) => {
      const weekNumber = props.ISOWeek ? getISOWeek(date) : getWeek(date);
      const week = weeksAcc.find((currentWeek) => currentWeek.weekNumber === weekNumber);

      const day = new CalendarDay(date, month, dateLib);

      if (!week) {
        weeksAcc.push(new CalendarWeek(weekNumber, [day]));
      } else {
        week.days.push(day);
      }

      return weeksAcc;
    }, []);

    const dayPickerMonth = new CalendarMonth(month, weeks);

    months.push(dayPickerMonth);

    return months;
  }, []);

  if (!props.reverseMonths) {
    return dayPickerMonths;
  }

  return dayPickerMonths.reverse();
}
