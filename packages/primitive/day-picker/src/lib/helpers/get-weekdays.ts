import { TZDate } from '@date-fns/tz';

import { type DateLib } from '@/lib/classes/date-lib';

/**
 * Generate a series of 7 days, starting from the week, to use for formatting
 * the weekday names (Monday, Tuesday, etc.).
 */
export function getWeekdays(
  /**
   * The date library.
   */
  dateLib: DateLib,

  /**
   * Use ISOWeek instead of locale/
   */
  ISOWeek?: boolean,
  timeZone?: string,
  broadcastCalendar?: boolean,
): Date[] {
  const date = timeZone ? TZDate.tz(timeZone) : new dateLib.Date();
  let start: Date;

  if (broadcastCalendar) {
    start = dateLib.startOfBroadcastWeek(date, dateLib);
  } else if (ISOWeek) {
    start = dateLib.startOfISOWeek(date);
  } else {
    start = dateLib.startOfWeek(date);
  }

  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const day = dateLib.addDays(start, i);

    days.push(day);
  }

  return days;
}
