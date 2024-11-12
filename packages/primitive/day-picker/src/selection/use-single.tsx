import type { DateLib } from '@/classes/date-lib';
import { useControlledValue } from '@/helpers/use-controlled-value';
import type { DayPickerProps, Modifiers, PropsSingle, SelectHandler, SelectedValue, Selection } from '@/types';

import type React from 'react';

export interface UseSingle<T extends DayPickerProps> {
  isSelected: (date: Date) => boolean;
  select: SelectHandler<T>;
  selected: SelectedValue<T>;
}

export function useSingle<T extends DayPickerProps>(props: DayPickerProps, dateLib: DateLib): Selection<T> {
  const { selected: initiallySelected, required, onSelect } = props as PropsSingle;

  const [internallySelected, setSelected] = useControlledValue(
    initiallySelected,
    onSelect ? initiallySelected : undefined,
  );

  const selected = !onSelect ? internallySelected : initiallySelected;

  const { isSameDay } = dateLib;

  const isSelected = (compareDate: Date) => {
    return selected ? isSameDay(selected, compareDate) : false;
  };

  const select = (triggerDate: Date, modifiers: Modifiers, e: React.MouseEvent | React.KeyboardEvent) => {
    let newDate: Date | undefined = triggerDate;

    if (!required && selected && selected && isSameDay(triggerDate, selected)) {
      // If the date is the same, clear the selection.
      newDate = undefined;
    }

    if (!onSelect) {
      setSelected(newDate);
    }

    if (required) {
      onSelect?.(newDate, triggerDate, modifiers, e);
    } else {
      onSelect?.(newDate, triggerDate, modifiers, e);
    }

    return newDate;
  };

  return {
    selected,
    select,
    isSelected,
  } as Selection<T>;
}
