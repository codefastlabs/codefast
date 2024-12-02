import { render } from '@testing-library/react';

import { dateButton, gridcell } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { Multiple } from './multiple';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<Multiple />);
}

describe('multiple component', () => {
  const day1 = new Date(2021, 10, 1);

  beforeEach(async () => {
    setup();
    await user.click(dateButton(day1));
  });

  test('displays the clicked day as selected', () => {
    expect(gridcell(day1, true)).toHaveAttribute('aria-selected', 'true');
  });

  describe('toggles off selection when the selected day is clicked again', () => {
    beforeEach(async () => {
      await user.click(dateButton(day1));
    });

    test('removes selection from the day', () => {
      expect(gridcell(day1, true)).not.toHaveAttribute('aria-selected');
    });
  });

  describe('selects additional day when a second day is clicked', () => {
    const day2 = new Date(2021, 10, 2);

    beforeEach(async () => {
      await user.click(dateButton(day2));
    });

    test('keeps the first day selected when a second day is clicked', () => {
      expect(gridcell(day1, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('displays the second clicked day as selected', () => {
      expect(gridcell(day2, true)).toHaveAttribute('aria-selected', 'true');
    });
  });
});
