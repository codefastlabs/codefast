import { render } from '@testing-library/react';
import { addDays } from 'date-fns';

import { dateButton, gridcell } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { RangeMinMax } from './range-min-max';

const today = new Date(2022, 8, 12);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<RangeMinMax />);
}

describe('range-min-max component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when selecting a single day', () => {
    const firstDay = new Date(2022, 8, 13);

    beforeEach(async () => {
      await user.click(dateButton(firstDay));
    });

    test('selects the clicked day as the start of the range', () => {
      expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
    });

    describe('when selecting a day within the minimum range limit', () => {
      const withinMinRangeDay = addDays(firstDay, 4);

      beforeEach(async () => {
        await user.click(dateButton(withinMinRangeDay));
      });

      test('selects all days from the first day to the selected day', () => {
        expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
        expect(gridcell(addDays(firstDay, 1), true)).toHaveAttribute('aria-selected', 'true');
        expect(gridcell(addDays(firstDay, 2), true)).toHaveAttribute('aria-selected', 'true');
        expect(gridcell(addDays(firstDay, 3), true)).toHaveAttribute('aria-selected', 'true');
        expect(gridcell(withinMinRangeDay, true)).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
