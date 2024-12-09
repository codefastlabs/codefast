import { act, renderHook } from '@testing-library/react';
import { type MouseEvent } from 'react';

import { defaultDateLib } from '@/lib/classes/date-lib';
import { useMulti } from '@/lib/hooks/use-multi';
import { type DayPickerProps } from '@/lib/types';

describe('useMulti', () => {
  test('uses the selected value from props when onSelect is provided', () => {
    const mockOnSelect = vi.fn();
    const selectedDates = [new Date(2023, 9, 1), new Date(2023, 9, 2)];
    const props: DayPickerProps = {
      mode: 'multiple',
      onSelect: mockOnSelect,
      selected: selectedDates,
    };

    const { result } = renderHook(() => useMulti(props, defaultDateLib));

    expect(result.current.selected).toBe(selectedDates);
  });

  test('uses the internally selected value when onSelect is not provided', () => {
    const initialSelectedDates = [new Date(2023, 9, 1), new Date(2023, 9, 2)];
    const props: DayPickerProps = {
      mode: 'multiple',
      selected: initialSelectedDates,
    };

    const { result } = renderHook(() => useMulti(props, defaultDateLib));

    act(() => {
      result.current.select?.(new Date(2023, 9, 3), {}, {} as MouseEvent);
    });

    expect(result.current.selected).toEqual([...initialSelectedDates, new Date(2023, 9, 3)]);
  });
});
