import { type CalendarDay, type CalendarMonth } from '@/lib/classes';

/**
 * Returns all the days belonging to the calendar by merging the days in the
 * weeks for each month.
 */
export function getDays(calendarMonths: CalendarMonth[]): CalendarDay[] {
  const initialDays: CalendarDay[] = [];

  return calendarMonths.reduce((days, month) => {
    const daysList: CalendarDay[] = [];
    const weekDays: CalendarDay[] = month.weeks.reduce((weekDaysAcc, week) => {
      return [...weekDaysAcc, ...week.days];
    }, daysList);

    return [...days, ...weekDays];
  }, initialDays);
}
