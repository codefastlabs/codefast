import { render } from '@testing-library/react';
import { subDays } from 'date-fns';

import { dateButton, gridcell, grids } from './lib/elements';
import { user } from './lib/user';
import { RangeLong } from './range-long';

const currentMonth = new Date(2024, 9); // Tháng 10, 2024
const rangeEnd = new Date(2024, 9, 10); // Ngày kết thúc: 10/10/2024

beforeAll(() => {
  jest.setSystemTime(currentMonth);
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<RangeLong />);
}

describe('range-long component', () => {
  beforeEach(() => {
    setup();
  });

  test('displays only the current month as per defaultMonth', () => {
    expect(grids()).toHaveLength(1);
    expect(grids()[0]).toHaveAccessibleName('October 2024');
  });

  describe('when initialized with a long range', () => {
    test('displays the range end date as selected', () => {
      expect(gridcell(rangeEnd, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('does not select any day before the current month', () => {
      const dayBeforeCurrentMonth = subDays(currentMonth, 1);

      expect(gridcell(dayBeforeCurrentMonth, true)).not.toHaveAttribute('aria-selected');
    });
  });

  describe('when a new day within the month is clicked', () => {
    const newEndDate = new Date(2024, 9, 15);

    beforeEach(async () => {
      await user.click(dateButton(newEndDate));
    });

    test('updates the range end date to the newly clicked day', () => {
      expect(gridcell(newEndDate, true)).toHaveAttribute('aria-selected', 'true');
    });
  });
});
