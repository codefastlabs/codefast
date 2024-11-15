import { useState } from 'react';

import { type CalendarDay, type DateLib } from '@/lib/classes';
import { calculateFocusTarget } from '@/lib/helpers/calculate-focus-target';
import { getNextFocus } from '@/lib/helpers/get-next-focus';
import { type Calendar } from '@/lib/hooks/use-calendar';
import { type DayPickerProps, type Modifiers, type MoveFocusBy, type MoveFocusDir } from '@/lib/types';

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
  const focusTarget = calculateFocusTarget(calendar.days, getModifiers, isSelected, lastFocused);
  const [focused, setFocused] = useState<CalendarDay | undefined>(autoFocus ? focusTarget : undefined);

  const blur = (): void => {
    setLastFocused(focused);
    setFocused(undefined);
  };

  const moveFocus = (moveBy: MoveFocusBy, moveDir: MoveFocusDir): void => {
    if (!focused) {
      return;
    }

    const nextFocus = getNextFocus(moveBy, moveDir, focused, calendar.navStart, calendar.navEnd, props, dateLib);

    if (!nextFocus) {
      return;
    }

    calendar.goToDay(nextFocus);
    setFocused(nextFocus);
  };

  const isFocusTarget = (day: CalendarDay): boolean => {
    return Boolean(focusTarget?.isEqualTo(day));
  };

  return {
    isFocusTarget,
    setFocused,
    focused,
    blur,
    moveFocus,
  };
}
