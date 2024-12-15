import type { DateLib } from '@/lib/classes/date-lib';
import type { DayPickerProps, MoveFocusBy, MoveFocusDir } from '@/lib/types';

/**
 * Return the next date that should be focused.
 */
export function getFocusableDate(
  moveBy: MoveFocusBy,
  moveDir: MoveFocusDir,
  refDate: Date,
  navStart: Date | undefined,
  navEnd: Date | undefined,
  props: Pick<DayPickerProps, 'broadcastCalendar' | 'ISOWeek'>,
  dateLib: DateLib,
): Date {
  const { broadcastCalendar, ISOWeek } = props;
  const {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    endOfBroadcastWeek,
    endOfISOWeek,
    endOfWeek,
    max,
    min,
    startOfBroadcastWeek,
    startOfISOWeek,
    startOfWeek,
  } = dateLib;
  const moveFns = {
    day: addDays,
    endOfWeek: (date: Date) => {
      if (broadcastCalendar) {
        return endOfBroadcastWeek(date, dateLib);
      } else if (ISOWeek) {
        return endOfISOWeek(date);
      }

      return endOfWeek(date);
    },
    month: addMonths,
    startOfWeek: (date: Date) => {
      if (broadcastCalendar) {
        return startOfBroadcastWeek(date, dateLib);
      } else if (ISOWeek) {
        return startOfISOWeek(date);
      }

      return startOfWeek(date);
    },
    week: addWeeks,
    year: addYears,
  };

  let focusableDate = moveFns[moveBy](refDate, moveDir === 'after' ? 1 : -1);

  if (moveDir === 'before' && navStart) {
    focusableDate = max([navStart, focusableDate]);
  } else if (moveDir === 'after' && navEnd) {
    focusableDate = min([navEnd, focusableDate]);
  }

  return focusableDate;
}
