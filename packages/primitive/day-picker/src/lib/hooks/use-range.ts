import type { DateLib } from '@/lib/classes/date-lib';
import type {
  DateRange,
  DayEvent,
  DayPickerProps,
  Modifiers,
  RangeProps,
  RangeRequiredProps,
  Selection,
} from '@/lib/types';

import { useControlledValue } from '@/lib/hooks/use-controlled-value';
import { addToRange, rangeContainsModifiers } from '@/lib/utils';
import { rangeIncludesDate } from '@/lib/utils/range-includes-date';

export function useRange<T extends DayPickerProps>(props: T, dateLib: DateLib): Selection<T> {
  const {
    disabled,
    excludeDisabled,
    onSelect,
    required,
    selected: initiallySelected,
  } = props as RangeProps | RangeRequiredProps;

  const [internallySelected, setSelected] = useControlledValue(
    initiallySelected,
    onSelect ? initiallySelected : undefined,
  );

  const selected = onSelect ? initiallySelected : internallySelected;

  const isSelected = (date: Date): boolean | undefined => selected && rangeIncludesDate(selected, date, false, dateLib);

  const select = (triggerDate: Date, modifiers: Modifiers, event: DayEvent): DateRange | undefined => {
    const { max, min } = props as RangeProps;
    const newRange = addToRange(triggerDate, selected, min, max, required, dateLib);

    if (
      excludeDisabled &&
      disabled &&
      newRange?.from &&
      newRange.to &&
      rangeContainsModifiers({ from: newRange.from, to: newRange.to }, disabled, dateLib)
    ) {
      // if disabled days are found, the range is reset
      newRange.from = triggerDate;
      newRange.to = undefined;
    }

    if (!onSelect) {
      setSelected(newRange);
    }

    if (!required) {
      onSelect?.(newRange, triggerDate, modifiers, event);
    } else if (newRange) {
      onSelect?.(newRange, triggerDate, modifiers, event);
    }

    return newRange;
  };

  return {
    isSelected,
    select,
    selected,
  } as Selection<T>;
}
