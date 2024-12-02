import { render, screen } from '@testing-library/react';
import { addDays, setDay } from 'date-fns';

import { dateButton, gridcell } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { RangeExcludeDisabled } from './range-exclude-disabled';

const today = new Date();
const nextMonday = setDay(addDays(today, 1), 1); // Ensure we have a Monday after today

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<RangeExcludeDisabled />);
}

describe('range-exclude-disabled component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when initializing the component', () => {
    test('disables Sundays and Saturdays', () => {
      const sunday = setDay(today, 0); // Sunday
      const saturday = setDay(today, 6); // Saturday

      expect(dateButton(sunday)).toBeDisabled();
      expect(dateButton(saturday)).toBeDisabled();
    });

    test('enables weekdays', () => {
      const weekday = setDay(today, 3); // Wednesday

      expect(dateButton(weekday)).toBeEnabled();
    });
  });

  describe('when selecting a range', () => {
    const firstDay = nextMonday;
    const secondDay = addDays(nextMonday, 5); // Includes a Saturday

    beforeEach(async () => {
      await user.click(dateButton(firstDay));
      await user.click(dateButton(secondDay));
    });

    test('does not include disabled days in the range', () => {
      const saturday = setDay(firstDay, 6); // Saturday within the range
      const sunday = setDay(firstDay, 0); // Sunday within the range

      expect(gridcell(saturday, true)).not.toHaveAttribute('aria-selected');
      expect(gridcell(sunday, true)).not.toHaveAttribute('aria-selected');
    });
  });

  describe('when trying to select a disabled day as the start of the range', () => {
    const disabledDay = setDay(today, 6); // Saturday

    beforeEach(async () => {
      await user.click(dateButton(disabledDay));
    });

    test('does not allow selection of the disabled day', () => {
      expect(gridcell(disabledDay, true)).not.toHaveAttribute('aria-selected');
    });
  });

  describe('when resetting the range', () => {
    const firstDay = nextMonday;
    const secondDay = addDays(nextMonday, 5); // Includes a Saturday

    beforeEach(async () => {
      await user.click(dateButton(firstDay));
      await user.click(dateButton(secondDay));
      await user.click(dateButton(firstDay)); // Reset range
    });

    test('clears all selected days', () => {
      const selectedCells = screen.getAllByRole('gridcell').filter((cell) => cell.hasAttribute('aria-selected'));

      expect(selectedCells).toHaveLength(0);
    });
  });
});
