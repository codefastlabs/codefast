import { type CalendarDay } from '@/lib/classes';
import { DayFlag } from '@/lib/constants/ui';
import { type Modifiers } from '@/lib/types';

/**
 * Determines the focus target within a set of calendar days based on several conditions.
 *
 * @param days - The array of {@link CalendarDay} objects representing the calendar days.
 * @param getModifiers - A callback function that retrieves the {@link Modifiers} of a given calendar day.
 * @param isSelected - A function that determines if a given date is selected.
 * @param lastFocused - The last {@link CalendarDay} that was focused, or `undefined` if there was none.
 * @returns The {@link CalendarDay} object that should be focused, or `undefined` if no focusable day is found.
 */
export function calculateFocusTarget(
  days: CalendarDay[],
  getModifiers: (day: CalendarDay) => Modifiers,
  isSelected: (date: Date) => boolean,
  lastFocused: CalendarDay | undefined,
): CalendarDay | undefined {
  let focusTarget: CalendarDay | undefined;

  let index = 0;
  let found = false;

  while (index < days.length && !found) {
    const day = days[index];
    const modifiers = getModifiers(day);

    if (!modifiers[DayFlag.disabled] && !modifiers[DayFlag.hidden] && !modifiers[DayFlag.outside]) {
      if (modifiers[DayFlag.focused]) {
        focusTarget = day;
        found = true;
      } else if (lastFocused?.isEqualTo(day)) {
        focusTarget = day;
        found = true;
      } else if (isSelected(day.date)) {
        focusTarget = day;
        found = true;
      } else if (modifiers[DayFlag.today]) {
        focusTarget = day;
        found = true;
      }
    }

    index++;
  }

  if (!focusTarget) {
    // return the first day that is focusable
    focusTarget = days.find((day) => {
      const m = getModifiers(day);

      return !m[DayFlag.disabled] && !m[DayFlag.hidden] && !m[DayFlag.outside];
    });
  }

  return focusTarget;
}
