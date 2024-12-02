import { render } from '@testing-library/react';

import { dateButton, gridcell, nextButton, previousButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { Start } from './start';

const today = new Date(2021, 10, 25); // November 25, 2021

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<Start />);
}

describe('start component', () => {
  beforeEach(() => {
    setup();
  });

  describe('navigation buttons', () => {
    test('displays the next month button and ensures it is enabled', () => {
      expect(nextButton()).toBeVisible();
      expect(nextButton()).not.toHaveAttribute('disabled');
    });

    test('displays the previous month button and ensures it is enabled', () => {
      expect(previousButton()).toBeVisible();
      expect(previousButton()).not.toHaveAttribute('disabled');
    });
  });

  describe('when a day is clicked', () => {
    const selectedDay = new Date(2021, 10, 1);

    beforeEach(async () => {
      await user.click(dateButton(selectedDay));
    });

    test('marks the clicked day as selected', () => {
      expect(gridcell(selectedDay, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('displays the correct footer message', () => {
      expect(document.body).toHaveTextContent(`Selected: ${selectedDay.toLocaleDateString()}`);
    });

    describe('when another day is clicked', () => {
      const anotherDay = new Date(2021, 10, 2);

      beforeEach(async () => {
        await user.click(dateButton(anotherDay));
      });

      test('marks the newly clicked day as selected', () => {
        expect(gridcell(anotherDay, true)).toHaveAttribute('aria-selected', 'true');
      });

      test('removes the selection from the previously selected day', () => {
        expect(gridcell(selectedDay, true)).not.toHaveAttribute('aria-selected');
      });

      test('updates the footer message to the newly selected day', () => {
        expect(document.body).toHaveTextContent(`Selected: ${anotherDay.toLocaleDateString()}`);
      });
    });
  });

  describe('when no day is selected initially', () => {
    test('displays the default footer message', () => {
      expect(document.body).toHaveTextContent('Pick a day.');
    });

    test('does not mark any day as selected', () => {
      // eslint-disable-next-line testing-library/no-node-access -- ignore
      const allCells = document.querySelectorAll('[aria-selected="true"]');

      expect(allCells).toHaveLength(0);
    });
  });
});
