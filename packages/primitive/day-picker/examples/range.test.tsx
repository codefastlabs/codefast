import { render, screen } from '@testing-library/react';
import { addDays } from 'date-fns';

import { dateButton, gridcell } from './lib/elements';
import { user } from './lib/user';
import { Range } from './range';

const defaultMonth = new Date(2020, 5, 15);

let container: HTMLElement;
const days = [
  defaultMonth,
  addDays(defaultMonth, 1),
  addDays(defaultMonth, 2),
  addDays(defaultMonth, 3),
  addDays(defaultMonth, 4),
];

function getAllSelected(): HTMLElement[] {
  const gridcells = screen.getAllByRole('cell');

  return Array.from(gridcells).filter((cell) => cell.getAttribute('aria-selected') === 'true');
}

describe('range component', () => {
  beforeEach(() => {
    container = render(<Range />).container;
  });

  test('matches the snapshot initially', () => {
    expect(container).toMatchSnapshot();
  });

  describe('when initialized with a default range', () => {
    test.each(days)('day %s should be selected', (day) => {
      expect(gridcell(day, true)).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('when a day in the range is clicked', () => {
    const selectedDay = days[2];

    beforeEach(async () => {
      await user.click(dateButton(selectedDay));
    });

    test('selects the days up to the clicked day', () => {
      days.slice(0, 3).forEach((day) => {
        expect(gridcell(day, true)).toHaveAttribute('aria-selected', 'true');
      });
    });

    test('deselects days after the clicked day', () => {
      days.slice(3).forEach((day) => {
        expect(gridcell(day, true)).not.toHaveAttribute('aria-selected');
      });
    });

    describe('when the reset button is clicked', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: 'Reset' }));
      });

      test('clears all selected days', () => {
        expect(getAllSelected()).toHaveLength(0);
      });
    });

    describe('when the same day is clicked again', () => {
      beforeEach(async () => {
        await user.click(dateButton(selectedDay));
      });

      test('only the clicked day remains selected', () => {
        expect(getAllSelected()).toHaveLength(1);
        expect(gridcell(selectedDay, true)).toHaveAttribute('aria-selected', 'true');
      });

      describe('when the same day is clicked once more', () => {
        beforeEach(async () => {
          await user.click(dateButton(selectedDay));
        });

        test('clears all selected days', () => {
          expect(getAllSelected()).toHaveLength(0);
        });

        test('matches the snapshot after clearing the selection', () => {
          expect(container).toMatchSnapshot();
        });
      });
    });
  });
});