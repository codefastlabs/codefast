import type { CalendarDay, CalendarMonth } from '@/lib/classes';

/**
 * Returns all the days belonging to the calendar by merging the days in the
 * weeks for each month.
 */
export function getDays(calendarMonths: CalendarMonth[]): CalendarDay[] {
  const allDays: CalendarDay[] = [];

  for (const month of calendarMonths) {
    for (const week of month.weeks) {
      allDays.push(...week.days);
    }
  }

  return allDays;
}
