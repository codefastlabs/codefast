import type { CalendarMonth, CalendarWeek } from '@/lib/classes';

/**
 *  Returns an array of calendar weeks from an array of calendar months.
 */
export function getWeeks(months: CalendarMonth[]): CalendarWeek[] {
  const weeks: CalendarWeek[] = [];

  for (const month of months) {
    weeks.push(...month.weeks);
  }

  return weeks;
}
