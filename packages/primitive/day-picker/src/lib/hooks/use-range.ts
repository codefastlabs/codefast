import { type DateLib } from '@/lib/classes/date-lib';
import { useControlledValue } from '@/lib/hooks/use-controlled-value';
import {
  type DateRange,
  type DayEvent,
  type DayPickerProps,
  type Modifiers,
  type RangeProps,
  type Selection,
} from '@/lib/types';
import { addToRange, rangeContainsModifiers } from '@/lib/utils';
import { rangeIncludesDate } from '@/lib/utils/range-includes-date';

export function useRange<T extends DayPickerProps>(props: T, dateLib: DateLib): Selection<T> {
  const { disabled, excludeDisabled, selected: initiallySelected, required, onSelect } = props as RangeProps;

  const [internallySelected, setSelected] = useControlledValue(
    initiallySelected,
    onSelect ? initiallySelected : undefined,
  );

  const selected = !onSelect ? internallySelected : initiallySelected;

  const isSelected = (date: Date): boolean | undefined => selected && rangeIncludesDate(selected, date, false, dateLib);

  const select = (triggerDate: Date, modifiers: Modifiers, event: DayEvent): DateRange | undefined => {
    const { min, max } = props as RangeProps;
    const newRange = triggerDate ? addToRange(triggerDate, selected, min, max, required, dateLib) : undefined;

    if (excludeDisabled && disabled && newRange?.from && newRange.to) {
      if (rangeContainsModifiers({ from: newRange.from, to: newRange.to }, disabled, dateLib)) {
        // if disabled days are found, the range is reset
        newRange.from = triggerDate;
        newRange.to = undefined;
      }
    }

    if (!onSelect) {
      setSelected(newRange);
    }

    onSelect?.(newRange, triggerDate, modifiers, event);

    return newRange;
  };

  return {
    selected,
    select,
    isSelected,
  } as Selection<T>;
}
