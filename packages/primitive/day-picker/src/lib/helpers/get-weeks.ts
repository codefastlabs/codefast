import { type CalendarMonth, type CalendarWeek } from '@/lib/classes';

/** Returns an array of calendar weeks from an array of calendar months. */
export function getWeeks(months: CalendarMonth[]): CalendarWeek[] {
  const initialWeeks: CalendarWeek[] = [];

  return months.reduce((weeks, month) => {
    return [...weeks, ...month.weeks];
  }, initialWeeks);
}
