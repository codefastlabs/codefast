import type { DateLib } from '@/lib/classes/date-lib';
import type { DayPickerProps, MoveFocusBy, MoveFocusDir } from '@/lib/types';

import { CalendarDay } from '@/lib/classes';
import { getFocusableDate } from '@/lib/helpers/get-focusable-date';
import { dateMatchModifiers } from '@/lib/utils/date-match-modifiers';

/**
 * Determines the next focusable date in a calendar based on user navigation actions.
 *
 * @param moveBy - Specifies how to move focus (e.g., by day, week).
 * @param moveDir - The direction of the focus movement (e.g., forward, backward).
 * @param refDay - The date that is currently focused.
 * @param calendarStartMonth - The start month of the calendar.
 * @param calendarEndMonth - The end month of the calendar.
 * @param props - Calendar properties including disabled, hidden dates, modifiers, ISOWeek, and timeZone.
 * @param dateLib - A library for date manipulation.
 * @param attempt - The current attempt count (used for recursion limit).
 * @returns The next focusable date as a CalendarDay instance or undefined if no focusable date is found within the
 *   limit.
 */
export function getNextFocus(
  moveBy: MoveFocusBy,
  moveDir: MoveFocusDir,

  /**
   * The date that is currently focused.
   */
  refDay: CalendarDay,
  calendarStartMonth: Date | undefined,
  calendarEndMonth: Date | undefined,
  props: Pick<DayPickerProps, 'disabled' | 'hidden' | 'ISOWeek' | 'modifiers' | 'timeZone'>,
  dateLib: DateLib,
  attempt = 0,
): CalendarDay | undefined {
  if (attempt > 365) {
    // Limit the recursion to 365 attempts
    return undefined;
  }

  const focusableDate = getFocusableDate(
    moveBy,
    moveDir,
    refDay.date, // should be refDay? or refDay.date?
    calendarStartMonth,
    calendarEndMonth,
    props,
    dateLib,
  );

  const isDisabled = Boolean(props.disabled && dateMatchModifiers(focusableDate, props.disabled, dateLib));

  const isHidden = Boolean(props.hidden && dateMatchModifiers(focusableDate, props.hidden, dateLib));

  const targetMonth = focusableDate;
  const focusDay = new CalendarDay(focusableDate, targetMonth, dateLib);

  if (!isDisabled && !isHidden) {
    return focusDay;
  }

  // Recursively attempt to find the next focusable date
  return getNextFocus(moveBy, moveDir, focusDay, calendarStartMonth, calendarEndMonth, props, dateLib, attempt + 1);
}
