import { render } from '@testing-library/react';

import { dateButton, gridcell } from './lib/elements';
import { user } from './lib/user';
import { SingleControlled } from './single-controlled';

const today = new Date(2024, 10, 25);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('single-controlled component', () => {
  beforeEach(() => {
    render(<SingleControlled />);
  });

  describe('when a single day is clicked', () => {
    const selectedDay = new Date(2024, 10, 1);

    beforeEach(async () => {
      await user.click(dateButton(selectedDay));
    });

    test('marks the clicked day as selected', () => {
      expect(gridcell(selectedDay, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('focuses on the clicked day', () => {
      expect(dateButton(selectedDay)).toHaveFocus();
    });

    test('applies the selected class to the clicked day', () => {
      expect(gridcell(selectedDay, true)).toHaveClass('rdp-selected');
    });

    describe('when the same day is clicked again', () => {
      beforeEach(async () => {
        await user.click(dateButton(selectedDay));
      });

      test('removes the selected state from the day', () => {
        expect(gridcell(selectedDay, true)).not.toHaveAttribute('aria-selected');
      });

      test('removes the selected class from the day', () => {
        expect(gridcell(selectedDay, true)).not.toHaveClass('rdp-selected');
      });
    });
  });

  describe('when selecting a different day', () => {
    const firstDay = new Date(2024, 10, 1);
    const secondDay = new Date(2024, 10, 2);

    beforeEach(async () => {
      await user.click(dateButton(firstDay));
      await user.click(dateButton(secondDay));
    });

    test('selects the newly clicked day', () => {
      expect(gridcell(secondDay, true)).toHaveAttribute('aria-selected', 'true');
    });

    test('deselects the previously selected day', () => {
      expect(gridcell(firstDay, true)).not.toHaveAttribute('aria-selected');
    });

    test('focuses on the newly selected day', () => {
      expect(dateButton(secondDay)).toHaveFocus();
    });
  });
});
