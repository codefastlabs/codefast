import { fireEvent, render } from '@testing-library/react';
import { addDays, startOfMonth } from 'date-fns';

import { dateButton, gridcell } from '~/lib/elements';

import { RangeRequired } from './range-required';

const startOfCurrentMonth = startOfMonth(new Date());
const initialEndDate = addDays(startOfCurrentMonth, 4); // 4 days after the start of the month
const anotherDay = addDays(initialEndDate, 1);

beforeAll(() => {
  jest.setSystemTime(new Date());
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<RangeRequired />);
}

describe('range-required component', () => {
  beforeEach(() => {
    setup();
  });

  test('initially displays the default range as selected', () => {
    expect(gridcell(startOfCurrentMonth, true)).toHaveAttribute('aria-selected', 'true');
    expect(gridcell(initialEndDate, true)).toHaveAttribute('aria-selected', 'true');
  });

  test('does not allow clearing the only selected range', () => {
    fireEvent.click(dateButton(startOfCurrentMonth));
    fireEvent.click(dateButton(initialEndDate));

    expect(gridcell(startOfCurrentMonth, true)).toHaveAttribute('aria-selected', 'true');
    expect(gridcell(initialEndDate, true)).toHaveAttribute('aria-selected', 'true');
  });

  describe('when extending the range', () => {
    beforeEach(() => {
      fireEvent.click(dateButton(anotherDay));
    });

    test('updates the range to include the new day', () => {
      expect(gridcell(anotherDay, true)).toHaveAttribute('aria-selected', 'true');
      expect(gridcell(startOfCurrentMonth, true)).toHaveAttribute('aria-selected', 'true');
      expect(gridcell(initialEndDate, true)).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('when selecting a completely new range', () => {
    const newStartDay = addDays(startOfCurrentMonth, 10);
    const newEndDay = addDays(newStartDay, 2);

    beforeEach(() => {
      fireEvent.click(dateButton(newStartDay));
      fireEvent.click(dateButton(newStartDay));
      fireEvent.click(dateButton(newEndDay));
    });

    test('clears the previous range', () => {
      expect(gridcell(startOfCurrentMonth, true)).not.toHaveAttribute('aria-selected');
      expect(gridcell(initialEndDate, true)).not.toHaveAttribute('aria-selected');
    });

    test('selects the new range', () => {
      expect(gridcell(newStartDay, true)).toHaveAttribute('aria-selected', 'true');
      expect(gridcell(newEndDay, true)).toHaveAttribute('aria-selected', 'true');
    });
  });
});
