import { render } from '@testing-library/react';
import { addDays } from 'date-fns';

import { dateButton, gridcell } from './lib/elements';
import { user } from './lib/user';
import { MultipleMinMax } from './multiple-min-max';

const today = new Date(2021, 10, 10);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

const days = [today, addDays(today, 1), addDays(today, 2), addDays(today, 3), addDays(today, 4)];

describe('multipleMinMax component', () => {
  beforeEach(() => {
    render(<MultipleMinMax />);
  });

  describe('when a single day is clicked', () => {
    beforeEach(async () => {
      await user.click(dateButton(days[0]));
    });

    test('displays the selected day as selected', () => {
      expect(gridcell(days[0], true)).toHaveAttribute('aria-selected', 'true');
    });

    describe('when a second day is clicked', () => {
      beforeEach(async () => {
        await user.click(dateButton(days[1]));
      });

      test('keeps the first day as selected', () => {
        expect(gridcell(days[0], true)).toHaveAttribute('aria-selected', 'true');
      });

      test('displays the second day as selected', () => {
        expect(gridcell(days[1], true)).toHaveAttribute('aria-selected', 'true');
      });

      describe('when the second day is clicked again', () => {
        beforeEach(async () => {
          await user.click(dateButton(days[1]));
        });

        test('keeps the first day as selected due to min constraint', () => {
          expect(gridcell(days[0], true)).toHaveAttribute('aria-selected', 'true');
        });

        test('keeps the second day as selected due to min constraint', () => {
          expect(gridcell(days[1], true)).toHaveAttribute('aria-selected', 'true');
        });
      });
    });
  });

  describe('when the first 5 days are clicked', () => {
    beforeEach(async () => {
      await user.click(dateButton(days[0]));
      await user.click(dateButton(days[1]));
      await user.click(dateButton(days[2]));
      await user.click(dateButton(days[3]));
      await user.click(dateButton(days[4]));
    });

    test.each(days)('displays the %s day as selected', (day) => {
      expect(gridcell(day, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('does not allow a sixth day to be selected due to max constraint', async () => {
      const day6 = addDays(today, 5);

      expect(gridcell(day6, true)).not.toHaveAttribute('aria-selected');
    });
  });
});
