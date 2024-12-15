import type { DateLib } from '@/lib/classes/date-lib';
import type {
  DayEvent,
  DayPickerProps,
  Modifiers,
  SelectedValue,
  SelectHandler,
  Selection,
  SingleProps,
  SingleRequiredProps,
} from '@/lib/types';

import { useControlledValue } from '@/lib/hooks/use-controlled-value';

export interface UseSingle<T extends DayPickerProps> {
  isSelected: (date: Date) => boolean;
  select: SelectHandler<T>;
  selected: SelectedValue<T>;
}

export function useSingle<T extends DayPickerProps>(props: DayPickerProps, dateLib: DateLib): Selection<T> {
  const { onSelect, required, selected: initiallySelected } = props as SingleProps | SingleRequiredProps;

  const [internallySelected, setSelected] = useControlledValue(
    initiallySelected,
    onSelect ? initiallySelected : undefined,
  );

  const selected = onSelect ? initiallySelected : internallySelected;

  const { isSameDay } = dateLib;

  const isSelected = (compareDate: Date): boolean => {
    return selected ? isSameDay(selected, compareDate) : false;
  };

  const select = (triggerDate: Date, modifiers: Modifiers, event: DayEvent): Date | undefined => {
    let newDate: Date | undefined = triggerDate;

    if (!required && selected && isSameDay(triggerDate, selected)) {
      // If the date is the same, clear the selection.
      newDate = undefined;
    }

    if (!onSelect) {
      setSelected(newDate);
    }

    if (!required) {
      onSelect?.(newDate, triggerDate, modifiers, event);
    } else if (newDate) {
      onSelect?.(newDate, triggerDate, modifiers, event);
    }

    return newDate;
  };

  return {
    isSelected,
    select,
    selected,
  } as Selection<T>;
}
