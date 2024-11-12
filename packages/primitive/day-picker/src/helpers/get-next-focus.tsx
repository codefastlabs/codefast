import { CalendarDay } from '@/classes';
import { type DateLib } from '@/classes/date-lib';
import { getFocusableDate } from '@/helpers/get-focusable-date';
import { type DayPickerProps, type MoveFocusBy, type MoveFocusDir } from '@/types';
import { dateMatchModifiers } from '@/utils/date-match-modifiers';

export function getNextFocus(
  moveBy: MoveFocusBy,
  moveDir: MoveFocusDir,
  /** The date that is currently focused. */
  refDay: CalendarDay,
  calendarStartMonth: Date | undefined,
  calendarEndMonth: Date | undefined,
  props: Pick<DayPickerProps, 'disabled' | 'hidden' | 'modifiers' | 'ISOWeek' | 'timeZone'>,
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
