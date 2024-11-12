import { type MouseEvent } from 'react';

import { defaultDateLib } from '@/classes/date-lib';
import { useMulti } from '@/selection/use-multi';
import { type DayPickerProps } from '@/types';

import { act, renderHook } from '@test/render';

describe('useMulti', () => {
  it('uses the selected value from props when onSelect is provided', () => {
    const mockOnSelect = jest.fn();
    const selectedDates = [new Date(2023, 9, 1), new Date(2023, 9, 2)];
    const props: DayPickerProps = {
      mode: 'multiple',
      selected: selectedDates,
      onSelect: mockOnSelect,
    };

    const { result } = renderHook(() => useMulti(props, defaultDateLib));

    expect(result.current.selected).toBe(selectedDates);
  });

  it('uses the internally selected value when onSelect is not provided', () => {
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
