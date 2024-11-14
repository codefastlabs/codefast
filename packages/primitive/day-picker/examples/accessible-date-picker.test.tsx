import { render, screen } from '@testing-library/react';
import { format, subDays } from 'date-fns';

import { AccessibleDatePicker } from './accessible-date-picker';
import { user } from './lib/user';

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

describe('accessible-date-picker component', () => {
  test('renders without crashing', () => {
    const { container } = render(<AccessibleDatePicker />);

    expect(container).toBeInTheDocument();
  });

  test('displays initial footer text prompting to pick a date', () => {
    render(<AccessibleDatePicker />);
    expect(screen.getByText('Please pick a date for the meeting.')).toBeInTheDocument();
  });

  describe('when a date is selected', () => {
    beforeEach(async () => {
      render(<AccessibleDatePicker />);
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
      render(<AccessibleDatePicker />);
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
