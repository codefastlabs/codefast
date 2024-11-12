import { type DateLib } from '@/classes/date-lib';
import { useControlledValue } from '@/helpers/use-controlled-value';
import { type DayPickerProps, type Modifiers, type PropsMulti, type Selection } from '@/types';

import type React from 'react';

export function useMulti<T extends DayPickerProps>(props: T, dateLib: DateLib): Selection<T> {
  const { selected: initiallySelected, required, onSelect } = props as PropsMulti;

  const [internallySelected, setSelected] = useControlledValue(
    initiallySelected,
    onSelect ? initiallySelected : undefined,
  );

  const selected = !onSelect ? internallySelected : initiallySelected;

  const { isSameDay } = dateLib;

  const isSelected = (date: Date): boolean => {
    return selected?.some((d) => isSameDay(d, date)) ?? false;
  };

  const { min, max } = props as PropsMulti;

  const select = (
    triggerDate: Date,
    modifiers: Modifiers,
    event: React.MouseEvent | React.KeyboardEvent,
  ): Date[] | undefined => {
    let newDates: Date[] | undefined = [...(selected ?? [])];

    if (isSelected(triggerDate)) {
      if (selected?.length === min) {
        // Min value reached, do nothing
        return;
      }

      if (required && selected?.length === 1) {
        // Required value already selected do nothing
        return;
      }

      newDates = selected?.filter((d) => !isSameDay(d, triggerDate));
    } else if (selected?.length === max) {
      // Max value reached, reset the selection to date
      newDates = [triggerDate];
    } else {
      // Add the date to the selection
      newDates = [...newDates, triggerDate];
    }

    if (!onSelect) {
      setSelected(newDates);
    }

    onSelect?.(newDates, triggerDate, modifiers, event);

    return newDates;
  };

  return {
    selected,
    select,
    isSelected,
  } as Selection<T>;
}
