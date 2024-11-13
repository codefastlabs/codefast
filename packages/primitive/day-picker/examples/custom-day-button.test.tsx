import { fireEvent, render, screen } from '@testing-library/react';
import { startOfMonth } from 'date-fns';

import { CustomDayButton } from './custom-day-button';
import { dateButton } from './lib/elements';

const today = new Date(2024, 11, 13);

beforeAll(() => {
  jest.setSystemTime(today);
});
afterAll(() => {
  jest.useRealTimers();
});

describe('custom-day-button component', () => {
  beforeEach(() => {
    render(<CustomDayButton />);
  });

  it('renders informational text on initial load', () => {
    expect(screen.getByText('Double click to select a date')).toBeInTheDocument();
  });

  it('clears the selected date on single click', () => {
    // Assume the user clicks on the button for the first day of the month.
    fireEvent.click(dateButton(startOfMonth(today)));

    // Kiểm tra rằng trạng thái trở về như ban đầu
    expect(screen.getByText('Double click to select a date')).toBeInTheDocument();
    expect(screen.queryByText(today.toDateString())).not.toBeInTheDocument();
  });

  it('selects a date on double click', () => {
    // Assuming the user double-clicks on the current date.
    fireEvent.doubleClick(dateButton(today));

    // Check that the selected date is displayed.
    expect(screen.queryByText(today.toDateString())).toBeInTheDocument();
    expect(screen.queryByText('Double click to select a date')).not.toBeInTheDocument();
  });
});
