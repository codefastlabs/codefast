import { act, renderHook } from '@testing-library/react';
import { type MouseEvent } from 'react';

import { defaultDateLib } from '@/lib/classes/date-lib';
import { useSingle } from '@/lib/hooks/use-single';
import { type DayPickerProps } from '@/lib/types';

describe('useSingle', () => {
  test('uses the selected value from props when onSelect is provided', () => {
    const mockOnSelect = jest.fn();
    const selectedDate = new Date(2023, 9, 1);
    const props: DayPickerProps = {
      mode: 'single',
      onSelect: mockOnSelect,
      selected: selectedDate,
    };

    const { result } = renderHook(() => useSingle(props, defaultDateLib));

    expect(result.current.selected).toBe(selectedDate);
  });

  test('uses the internally selected value when onSelect is not provided', () => {
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
