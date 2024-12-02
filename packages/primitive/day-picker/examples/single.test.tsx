import { render } from '@testing-library/react';

import { dateButton, gridcell } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { Single } from './single';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<Single />);
}

describe('single component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when a single day is clicked', () => {
    const day = new Date(2021, 10, 1);

    beforeEach(async () => {
      await user.click(dateButton(day));
    });

    test('marks the day as selected', () => {
      expect(gridcell(day, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('focuses on the selected day', () => {
      expect(dateButton(day)).toHaveFocus();
    });

    test('applies the selected class to the day', () => {
      expect(gridcell(day, true)).toHaveClass('rdp-selected');
    });

    describe('when the selected day is clicked again', () => {
      beforeEach(async () => {
        await user.click(dateButton(day));
      });

      test('removes the selected state from the day', () => {
        expect(gridcell(day, true)).not.toHaveAttribute('aria-selected');
      });

      test('removes the selected class from the day', () => {
        expect(gridcell(day, true)).not.toHaveClass('rdp-selected');
      });
    });
  });
});
