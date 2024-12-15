import type { DateLib } from '@/lib';

import { getBroadcastWeeksInMonth } from '@/lib/helpers/get-broadcast-weeks-in-month';
import { startOfBroadcastWeek } from '@/lib/helpers/start-of-broadcast-week';

/**
 * Return the end date of the week in the broadcast calendar.
 */
export function endOfBroadcastWeek(date: Date, dateLib: DateLib): Date {
  const startDate = startOfBroadcastWeek(date, dateLib);
  const numberOfWeeks = getBroadcastWeeksInMonth(date, dateLib);

  return dateLib.addDays(startDate, numberOfWeeks * 7 - 1);
}
