import { useState } from 'react';

import { type CalendarDay, type DateLib } from '@/classes';
import { calculateFocusTarget } from '@/helpers/calculate-focus-target';
import { getNextFocus } from '@/helpers/get-next-focus';
import { type MoveFocusBy, type MoveFocusDir, type DayPickerProps, type Modifiers } from '@/types';
import { type Calendar } from '@/use-calendar';

export interface UseFocus {
  /** Blur the focused day. */
  blur: () => void;

  /** The date that is currently focused. */
  focused: CalendarDay | undefined;

  /** Check if the given day is the focus target when entering the calendar. */
  isFocusTarget: (day: CalendarDay) => boolean;

  /** Move the current focus to the next day according to the given direction. */
  moveFocus: (moveBy: MoveFocusBy, moveDir: MoveFocusDir) => void;

  /** Focus the given day. */
  setFocused: (day: CalendarDay | undefined) => void;
}

export function useFocus<T extends DayPickerProps>(
  props: T,
  calendar: Calendar,
  getModifiers: (day: CalendarDay) => Modifiers,
  isSelected: (date: Date) => boolean,
  dateLib: DateLib,
): UseFocus {
  const { autoFocus } = props;
  const [lastFocused, setLastFocused] = useState<CalendarDay | undefined>();

  const focusTarget = calculateFocusTarget(calendar.days, getModifiers, isSelected || (() => false), lastFocused);
  const [focusedDay, setFocused] = useState<CalendarDay | undefined>(autoFocus ? focusTarget : undefined);

  const blur = (): void => {
    setLastFocused(focusedDay);
    setFocused(undefined);
  };

  const moveFocus = (moveBy: MoveFocusBy, moveDir: MoveFocusDir): void => {
    if (!focusedDay) {
      return;
    }

    const nextFocus = getNextFocus(moveBy, moveDir, focusedDay, calendar.navStart, calendar.navEnd, props, dateLib);

    if (!nextFocus) {
      return;
    }

    calendar.goToDay(nextFocus);
    setFocused(nextFocus);
  };

  const isFocusTarget = (day: CalendarDay): boolean => {
    return Boolean(focusTarget?.isEqualTo(day));
  };

  const useFocus: UseFocus = {
    isFocusTarget,
    setFocused,
    focused: focusedDay,
    blur,
    moveFocus,
  };

  return useFocus;
}
