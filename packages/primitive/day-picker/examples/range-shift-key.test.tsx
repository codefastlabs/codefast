import { render } from '@testing-library/react';

import { dateButton, gridcell } from '~/lib/elements';
import { user } from '~/lib/user';
import { RangeShiftKey } from '~/range-shift-key';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<RangeShiftKey />);
}

describe('range-shift-key component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when clicking on a single day without pressing Shift', () => {
    const firstDay = new Date(2021, 10, 11);

    beforeEach(async () => user.click(dateButton(firstDay)));

    test('marks the clicked day as selected', () => {
      expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
    });

    describe('when clicking another day without Shift', () => {
      const secondDay = new Date(2021, 10, 13);

      beforeEach(async () => user.click(dateButton(secondDay)));

      test('does not select the second day', () => {
        expect(gridcell(secondDay, true)).not.toHaveAttribute('aria-selected');
      });

      test('keeps the first day selected', () => {
        expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
      });
    });

    describe('when clicking another day with Shift pressed', () => {
      const secondDay = new Date(2021, 10, 13);

      beforeEach(async () => {
        await user.keyboard('{Shift>}');
        await user.click(dateButton(secondDay));
      });

      test('selects the second day as part of the range', () => {
        expect(gridcell(secondDay, true)).toHaveAttribute('aria-selected', 'true');
      });

      test('keeps the first day selected', () => {
        expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
      });

      test('selects all days between the first and second day', () => {
        const intermediateDay = new Date(2021, 10, 12);

        expect(gridcell(intermediateDay, true)).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
