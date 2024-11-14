import { render, screen } from '@testing-library/react';
import { endOfWeek, startOfWeek } from 'date-fns';

import { CustomWeek } from './custom-week';
import { dateButton, gridcell } from './lib/elements';
import { user } from './lib/user';

const today = new Date(2024, 11, 13);
const startOfThisWeek = startOfWeek(today);
const endOfThisWeek = endOfWeek(today);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('custom-week component', () => {
  beforeEach(() => {
    render(<CustomWeek />);
  });

  it('renders without any selected week initially', () => {
    // Check that there is no weekly information in the initial footer.
    expect(screen.queryByText(/Week from/)).toBeNull();
  });

  it('selects a full week when a day is clicked', async () => {
    // Assume the user clicks on today's date.
    await user.click(dateButton(today));

    // Check that the footer displays the selected week.
    expect(
      screen.getByText(`Week from ${startOfThisWeek.toLocaleDateString()} to ${endOfThisWeek.toLocaleDateString()}`),
    ).toBeInTheDocument();

    // Check the selected days of the week.
    for (let date = new Date(startOfThisWeek); date <= endOfThisWeek; date.setDate(date.getDate() + 1)) {
      expect(gridcell(new Date(date), true)).toHaveAttribute('aria-selected', 'true');
    }
  });

  it('clears the selected week when a selected day is clicked again', async () => {
    // Assume the user clicks on today's date to select the week.
    await user.click(dateButton(today));

    // Check that the week has been selected
    expect(
      screen.getByText(`Week from ${startOfThisWeek.toLocaleDateString()} to ${endOfThisWeek.toLocaleDateString()}`),
    ).toBeInTheDocument();

    // Assume the user clicks on today to deselect the week.
    await user.click(dateButton(today));

    // Check that the footer doesn't display information about next week.
    expect(screen.queryByText(/Week from/)).toBeNull();

    // Make sure that no day of the week is selected.
    for (let date = new Date(startOfThisWeek); date <= endOfThisWeek; date.setDate(date.getDate() + 1)) {
      expect(gridcell(new Date(date), true)).not.toHaveAttribute('aria-selected', 'true');
    }
  });
});
