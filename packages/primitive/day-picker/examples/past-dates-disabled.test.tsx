import { fireEvent, render } from '@testing-library/react';
import { addDays, subDays } from 'date-fns';

import { dateButton, gridcell } from '~/lib/elements';
import { PastDatesDisabled } from '~/past-dates-disabled';

const today = new Date(2024, 11, 27);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<PastDatesDisabled />);
}

describe('past-dates-disabled component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when checking date availability', () => {
    test('disables dates before today', () => {
      const pastDate = subDays(today, 1); // Ngày hôm qua

      expect(dateButton(pastDate)).toBeDisabled();
    });

    test('enables today’s date', () => {
      expect(dateButton(today)).toBeEnabled();
    });

    test('enables dates after today', () => {
      const futureDate = addDays(today, 1); // Ngày mai

      expect(dateButton(futureDate)).toBeEnabled();
    });
  });

  describe('when selecting dates', () => {
    test('does not allow past dates to be selected', () => {
      const pastDate = subDays(today, 1);

      expect(gridcell(pastDate, true)).not.toHaveAttribute('aria-selected', 'true');
    });

    test('allows today’s date to be selected', () => {
      fireEvent.click(dateButton(today));
      expect(gridcell(today, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('allows future dates to be selected', () => {
      const futureDate = addDays(today, 1);

      fireEvent.click(dateButton(futureDate));
      expect(gridcell(futureDate, true)).toHaveAttribute('aria-selected', 'true');
    });
  });
});
