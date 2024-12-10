import { act, renderHook } from '@testing-library/react';
import { type MouseEvent } from 'react';

import { defaultDateLib } from '@/lib/classes/date-lib';
import { useRange } from '@/lib/hooks/use-range';
import { type DayPickerProps } from '@/lib/types';

describe('useRange', () => {
  test('initialize with initiallySelected date range', () => {
    const initiallySelected = {
      from: new Date(2023, 6, 1),
      to: new Date(2023, 6, 5),
    };
    const { result } = renderHook(() =>
      useRange({ mode: 'range', required: false, selected: initiallySelected }, defaultDateLib),
    );

    expect(result.current.selected).toEqual(initiallySelected);
  });

  test('update the selected range on select', () => {
    const initiallySelected = {
      from: new Date(2023, 6, 1),
      to: new Date(2023, 6, 5),
    };
    const { result } = renderHook(() =>
      useRange({ mode: 'range', required: false, selected: initiallySelected }, defaultDateLib),
    );

    act(() => {
      result.current.select?.(new Date(2023, 6, 10), {}, {} as MouseEvent);
    });

    expect(result.current.selected).toEqual({
      from: new Date(2023, 6, 1),
      to: new Date(2023, 6, 10),
    });
  });

  test('reset range if new range exceeds max days', () => {
    const { result } = renderHook(() =>
      useRange(
        {
          max: 5,
          mode: 'range',
          required: false,
          selected: undefined,
        },
        defaultDateLib,
      ),
    );

    act(() => {
      result.current.select?.(new Date(2023, 6, 1), {}, {} as MouseEvent);
      result.current.select?.(new Date(2023, 6, 10), {}, {} as MouseEvent);
    });

    expect(result.current.selected).toEqual({
      from: new Date(2023, 6, 10),
      to: new Date(2023, 6, 10),
    });
  });

  test('reset range if new range is less than min days', () => {
    const { result } = renderHook(() =>
      useRange({ min: 5, mode: 'range', required: false, selected: undefined }, defaultDateLib),
    );

    act(() => {
      result.current.select?.(new Date(2023, 6, 1), {}, {} as MouseEvent);
      result.current.select?.(new Date(2023, 6, 3), {}, {} as MouseEvent);
    });

    expect(result.current.selected).toEqual({
      from: new Date(2023, 6, 3),
      to: undefined,
    });
  });

  test('exclude disabled dates when selecting range', () => {
    const disabled = [{ from: new Date(2023, 6, 5), to: new Date(2023, 6, 7) }];
    const { result } = renderHook(() =>
      useRange(
        {
          disabled,
          excludeDisabled: true,
          mode: 'range',
          required: false,
          selected: undefined,
        },
        defaultDateLib,
      ),
    );

    act(() => {
      result.current.select?.(new Date(2023, 6, 1), {}, {} as MouseEvent);
      result.current.select?.(new Date(2023, 6, 10), {}, {} as MouseEvent);
    });

    expect(result.current.selected).toEqual({
      from: new Date(2023, 6, 10),
      to: new Date(2023, 6, 10),
    });
  });
  test('uses the selected value from props when onSelect is provided', () => {
    const mockOnSelect = jest.fn();
    const selectedRange = {
      from: new Date(2023, 9, 1),
      to: new Date(2023, 9, 5),
    };
    const props: DayPickerProps = {
      mode: 'range',

      onSelect: mockOnSelect,
      selected: selectedRange,
    };

    const { result } = renderHook(() => useRange(props, defaultDateLib));

    expect(result.current.selected).toBe(selectedRange);
  });

  test('uses the internally selected value when onSelect is not provided', () => {
    const initialSelectedRange = {
      from: new Date(2023, 9, 1),
      to: new Date(2023, 9, 5),
    };
    const props: DayPickerProps = {
      mode: 'range',
      selected: initialSelectedRange,
    };

    const { result } = renderHook(() => useRange(props, defaultDateLib));

    act(() => {
      result.current.select?.(new Date(2023, 9, 6), {}, {} as MouseEvent);
    });

    expect(result.current.selected).toEqual({
      from: new Date(2023, 9, 1),
      to: new Date(2023, 9, 6),
    });
  });
});
