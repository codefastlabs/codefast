import { render, screen } from '@testing-library/react';
import { format, subDays } from 'date-fns';

import { user } from '~/lib/user';

import { AccessibleDatePicker } from './accessible-date-picker';

const today = new Date();

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

function customDateButton(date: Date): HTMLElement {
  return screen.getByRole('button', {
    name: new RegExp(format(date, 'PPP')),
  });
}

function setup(): void {
  render(<AccessibleDatePicker />);
}

describe('accessible-date-picker component', () => {
  test('displays initial footer text prompting to pick a date', () => {
    setup();
    expect(screen.getByText('Please pick a date for the meeting.')).toBeInTheDocument();
  });

  describe('when a date is selected', () => {
    beforeEach(async () => {
      setup();
      await user.click(customDateButton(today));
    });

    test('updates footer text with the selected meeting date', () => {
      const formattedDate = `Meeting date is set to ${format(today, 'PPPP')}`;

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    test('updates the day button aria-label with the selected meeting date', () => {
      const formattedAriaLabel = `Selected Meeting Date: ${format(today, 'PPP')}`;

      expect(customDateButton(today)).toHaveAccessibleName(formattedAriaLabel);
    });
  });

  describe('when a different date is selected', () => {
    const anotherDay = subDays(today, 1);

    beforeEach(async () => {
      setup();
      await user.click(customDateButton(anotherDay));
    });

    test('updates footer text with the new meeting date', () => {
      const formattedDate = `Meeting date is set to ${format(anotherDay, 'PPPP')}`;

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    test('updates the aria-label of the new selected date button', () => {
      const formattedAriaLabel = `Selected Meeting Date: ${format(anotherDay, 'PPP')}`;

      expect(customDateButton(anotherDay)).toHaveAccessibleName(formattedAriaLabel);
    });

    test('reverts aria-label of the previously selected date to default format', () => {
      const formattedAriaLabel = format(today, 'PPP');

      expect(customDateButton(today)).toHaveAccessibleName(formattedAriaLabel);
    });
  });
});
