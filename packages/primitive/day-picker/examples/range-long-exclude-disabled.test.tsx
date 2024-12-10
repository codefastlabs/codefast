import { render } from '@testing-library/react';
import { addDays } from 'date-fns';

import { dateButton, gridcell } from '~/lib/elements';
import { user } from '~/lib/user';
import { RangeLongExcludeDisabled } from '~/range-long-exclude-disabled';

const rangeStart = new Date(100, 0, 1); // January 1, year 100
const rangeEnd = new Date(2024, 9, 10); // October 10, 2024
const disabledDate = new Date(2000, 0, 1); // January 1, 2000 (disabled)

beforeAll(() => {
  jest.setSystemTime(new Date(2024, 9, 10)); // Freeze time for consistent results
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<RangeLongExcludeDisabled />);
}

describe('range-long-exclude-disabled component', () => {
  beforeEach(() => {
    setup();
  });

  test('initializes with the correct selected range', () => {
    expect(gridcell(rangeEnd, true)).toHaveAttribute('aria-selected', 'true');
  });

  test('disables the specified date', () => {
    // Verify the specified disabled date cannot be selected
    expect(dateButton(disabledDate)).toBeDisabled();
  });

  test('excludes disabled date from the selected range', () => {
    // Ensure the disabled date is not within the selected range
    expect(gridcell(disabledDate, true)).not.toHaveAttribute('aria-selected');
  });

  describe('when selecting a new range within the month', () => {
    const newStart = new Date(2000, 0, 2); // January 2, 2000
    const newEnd = addDays(newStart, 5); // January 7, 2000

    beforeEach(async () => {
      await user.click(dateButton(newStart));
      await user.click(dateButton(newEnd));
    });

    test('updates the range to start and end on the selected dates', () => {
      expect(gridcell(newStart, true)).toHaveAttribute('aria-selected', 'true');
      expect(gridcell(newEnd, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('ensures the previous range is cleared', () => {
      expect(gridcell(rangeStart, true)).not.toHaveAttribute('aria-selected');
      expect(gridcell(rangeEnd, true)).not.toHaveAttribute('aria-selected');
    });

    test('excludes the disabled date even in the new range', () => {
      expect(gridcell(disabledDate, true)).not.toHaveAttribute('aria-selected');
    });
  });
});
