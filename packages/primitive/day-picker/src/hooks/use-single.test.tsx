import { type MouseEvent } from 'react';

import { defaultDateLib } from '@/classes/date-lib';
import { useSingle } from '@/hooks/use-single';
import { type DayPickerProps } from '@/types';

import { act, renderHook } from '@test/render';

describe('useSingle', () => {
  it('uses the selected value from props when onSelect is provided', () => {
    const mockOnSelect = jest.fn();
    const selectedDate = new Date(2023, 9, 1);
    const props: DayPickerProps = {
      mode: 'single',
      selected: selectedDate,
      onSelect: mockOnSelect,
    };

    const { result } = renderHook(() => useSingle(props, defaultDateLib));

    expect(result.current.selected).toBe(selectedDate);
  });

  it('uses the internally selected value when onSelect is not provided', () => {
    const initialSelectedDate = new Date(2023, 9, 1);
    const props: DayPickerProps = {
      mode: 'single',
      selected: initialSelectedDate,
    };

    const { result } = renderHook(() => useSingle(props, defaultDateLib));

    act(() => {
      result.current.select?.(new Date(2023, 9, 2), {}, {} as MouseEvent);
    });

    expect(result.current.selected).toEqual(new Date(2023, 9, 2));
  });
});