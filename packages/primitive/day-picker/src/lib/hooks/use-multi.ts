import type { DateLib } from '@/lib/classes/date-lib';
import type { DayEvent, DayPickerProps, Modifiers, MultiProps, MultiRequiredProps, Selection } from '@/lib/types';

import { useControlledValue } from '@/lib/hooks/use-controlled-value';

export function useMulti<T extends DayPickerProps>(props: T, dateLib: DateLib): Selection<T> {
  const { onSelect, required, selected: initiallySelected } = props as MultiProps | MultiRequiredProps;

  const [internallySelected, setSelected] = useControlledValue(
    initiallySelected,
    onSelect ? initiallySelected : undefined,
  );

  const selected = onSelect ? initiallySelected : internallySelected;

  const { isSameDay } = dateLib;

  const isSelected = (date: Date): boolean => {
    return selected?.some((d) => isSameDay(d, date)) ?? false;
  };

  const { max, min } = props as MultiProps;

  const select = (triggerDate: Date, modifiers: Modifiers, event: DayEvent): Date[] | undefined => {
    let newDates: Date[] | undefined = [...(selected ?? [])];

    if (isSelected(triggerDate)) {
      if (selected?.length === min) {
        // Min value reached, do nothing
        return;
      }

      if (required && selected?.length === 1) {
        // The required value already selected does nothing
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

    if (!required) {
      onSelect?.(newDates, triggerDate, modifiers, event);
    } else if (newDates) {
      onSelect?.(newDates, triggerDate, modifiers, event);
    }

    return newDates;
  };

  return {
    isSelected,
    select,
    selected,
  } as Selection<T>;
}
