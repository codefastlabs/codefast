import { render } from '@testing-library/react';

import { dateButton, gridcell } from './lib/elements';
import { user } from './lib/user';
import { SingleRequired } from './single-required';

const today = new Date(2024, 10, 5);

beforeAll(() => {
  vi.setSystemTime(today); // Thiết lập ngày cố định cho các test case
});

afterAll(() => {
  vi.useRealTimers(); // Reset lại thời gian sau khi hoàn thành các test case
});

function setup(): void {
  render(<SingleRequired />);
}

describe('single-required component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when no day is selected initially', () => {
    test('does not allow a state with no selected day after an interaction', async () => {
      const firstDay = new Date(2024, 10, 1);

      await user.click(dateButton(firstDay)); // Select the first day
      await user.click(dateButton(firstDay)); // Attempt to deselect

      expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('when a day is clicked', () => {
    const firstDay = new Date(2024, 10, 1);

    beforeEach(async () => {
      await user.click(dateButton(firstDay));
    });

    test('marks the clicked day as selected', () => {
      expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
    });

    describe('when the same day is clicked again', () => {
      beforeEach(async () => {
        await user.click(dateButton(firstDay));
      });

      test('keeps the day selected due to "required" behavior', () => {
        expect(gridcell(firstDay, true)).toHaveAttribute('aria-selected', 'true');
      });
    });

    describe('when a different day is clicked', () => {
      const secondDay = new Date(2024, 10, 2);

      beforeEach(async () => {
        await user.click(dateButton(secondDay));
      });

      test('selects the newly clicked day', () => {
        expect(gridcell(secondDay, true)).toHaveAttribute('aria-selected', 'true');
      });

      test('deselects the previously selected day', () => {
        expect(gridcell(firstDay, true)).not.toHaveAttribute('aria-selected');
      });
    });
  });
});
