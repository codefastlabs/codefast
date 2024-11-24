import { fireEvent, render } from '@testing-library/react';
import { addDays } from 'date-fns';

import { dateButton, gridcell } from './lib/elements';
import { MultipleRequired } from './multiple-required';

const today = new Date();
const anotherDay = addDays(today, 1);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<MultipleRequired />);
}

describe('multiple-required component', () => {
  beforeEach(() => {
    setup();
  });

  test('initially displays today as selected', () => {
    expect(gridcell(today, true)).toHaveAttribute('aria-selected', 'true');
  });

  test('does not allow unselecting the only selected day', () => {
    fireEvent.click(dateButton(today));
    expect(gridcell(today, true)).toHaveAttribute('aria-selected', 'true');
  });

  describe('when another day is selected', () => {
    beforeEach(() => {
      fireEvent.click(dateButton(anotherDay));
    });

    test('both today and the other day should be selected', () => {
      expect(gridcell(today, true)).toHaveAttribute('aria-selected', 'true');
      expect(gridcell(anotherDay, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('allows unselecting one day if more than one day is selected', () => {
      fireEvent.click(dateButton(today));

      expect(gridcell(today, true)).not.toHaveAttribute('aria-selected');
      expect(gridcell(anotherDay, true)).toHaveAttribute('aria-selected', 'true');
    });
  });
});
