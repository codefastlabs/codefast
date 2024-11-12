import { type MouseEvent, type KeyboardEvent } from 'react';

import { type DateLib } from '@/classes/date-lib';
import { useControlledValue } from '@/hooks/use-controlled-value';
import {
  type DayPickerProps,
  type Modifiers,
  type PropsSingle,
  type SelectHandler,
  type SelectedValue,
  type Selection,
} from '@/types';

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

  const isSelected = (compareDate: Date): boolean => {
    return selected ? isSameDay(selected, compareDate) : false;
  };

  const select = (triggerDate: Date, modifiers: Modifiers, event: MouseEvent | KeyboardEvent): Date | undefined => {
    let newDate: Date | undefined = triggerDate;

    if (!required && selected && selected && isSameDay(triggerDate, selected)) {
      // If the date is the same, clear the selection.
      newDate = undefined;
    }

    if (!onSelect) {
      setSelected(newDate);
    }

    if (required) {
      onSelect?.(newDate, triggerDate, modifiers, event);
    } else {
      onSelect?.(newDate, triggerDate, modifiers, event);
    }

    return newDate;
  };

  return {
    selected,
    select,
    isSelected,
  } as Selection<T>;
}
