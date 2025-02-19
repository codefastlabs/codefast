import { TZDate } from '@date-fns/tz';

import type { CalendarDay, DateLib } from '@/lib/classes';
import type { DayPickerProps, Modifiers } from '@/lib/types';

import { DayFlag } from '@/lib/constants/ui';
import { dateMatchModifiers } from '@/lib/utils/date-match-modifiers';

/**
 * Return a function to get the modifiers for a given day.
 */
export function useGetModifiers(
  days: CalendarDay[],
  props: DayPickerProps,
  dateLib: DateLib,
): (day: CalendarDay) => Modifiers {
  const { broadcastCalendar, disabled, endMonth, hidden, modifiers, showOutsideDays, startMonth, today } = props;

  const { endOfMonth, isAfter, isBefore, isSameDay, isSameMonth, startOfMonth } = dateLib;

  const internalModifiersMap: Record<DayFlag, CalendarDay[]> = {
    [DayFlag.disabled]: [],
    [DayFlag.focused]: [],
    [DayFlag.hidden]: [],
    [DayFlag.outside]: [],
    [DayFlag.today]: [],
  };

  const customModifiersMap: Record<string, CalendarDay[]> = {};

  for (const day of days) {
    const { date, displayMonth } = day;

    const isOutside = Boolean(!isSameMonth(date, displayMonth));

    const isBeforeStartMonth = Boolean(startMonth && isBefore(date, startOfMonth(startMonth)));

    const isAfterEndMonth = Boolean(endMonth && isAfter(date, endOfMonth(endMonth)));

    const isDisabled = Boolean(disabled && dateMatchModifiers(date, disabled, dateLib));

    const isHidden =
      Boolean(hidden && dateMatchModifiers(date, hidden, dateLib)) ||
      isBeforeStartMonth ||
      isAfterEndMonth ||
      // Broadcast calendar will show outside days as default
      (!broadcastCalendar && !showOutsideDays && isOutside) ||
      (broadcastCalendar && showOutsideDays === false && isOutside);

    const isToday = isSameDay(date, today ?? (props.timeZone ? TZDate.tz(props.timeZone) : new dateLib.Date()));

    if (isOutside) {
      internalModifiersMap.outside.push(day);
    }

    if (isDisabled) {
      internalModifiersMap.disabled.push(day);
    }

    if (isHidden) {
      internalModifiersMap.hidden.push(day);
    }

    if (isToday) {
      internalModifiersMap.today.push(day);
    }

    // Add custom modifiers
    if (modifiers) {
      for (const name of Object.keys(modifiers)) {
        const modifierValue = modifiers[name];
        const isMatch = modifierValue ? dateMatchModifiers(date, modifierValue, dateLib) : false;

        if (!isMatch) {
          continue;
        }

        if (name in customModifiersMap) {
          customModifiersMap[name].push(day);
        } else {
          customModifiersMap[name] = [day];
        }
      }
    }
  }

  return (day: CalendarDay): Modifiers => {
    // Initialize all the modifiers to false
    const dayFlags: Record<DayFlag, boolean> = {
      [DayFlag.disabled]: false,
      [DayFlag.focused]: false,
      [DayFlag.hidden]: false,
      [DayFlag.outside]: false,
      [DayFlag.today]: false,
    };
    const customModifiers: Modifiers = {};

    // Find the modifiers for the given day
    for (const name in internalModifiersMap) {
      const daysForFlag = internalModifiersMap[name as DayFlag];

      dayFlags[name as DayFlag] = daysForFlag.includes(day);
    }

    for (const name in customModifiersMap) {
      customModifiers[name] = Boolean(customModifiersMap[name].includes(day));
    }

    return {
      ...dayFlags,
      // custom modifiers should override all the previous ones
      ...customModifiers,
    };
  };
}
