import { fireEvent, render, screen } from '@testing-library/react';

import { CustomMultiple } from './custom-multiple';
import { dateButton, gridCell } from './lib/elements';

const today = new Date(2024, 11, 13);
const tomorrow = new Date(2024, 11, 14);

beforeAll(() => {
  jest.setSystemTime(today);
});
afterAll(() => {
  jest.useRealTimers();
});

describe('custom-multiple component', () => {
  beforeEach(() => {
    render(<CustomMultiple />);
  });

  it('displays the initial footer text', () => {
    expect(screen.getByText('Please pick one or more days.')).toBeInTheDocument();
  });

  it('adds a day to the selection when a date is clicked', () => {
    fireEvent.click(dateButton(today));

    expect(screen.getByText('You selected 1 days.')).toBeInTheDocument();
    expect(gridCell(today, true)).toHaveAttribute('aria-selected', 'true');
  });

  it('adds another day to the selection when another date (tomorrow) is clicked', () => {
    fireEvent.click(dateButton(today));
    fireEvent.click(dateButton(tomorrow));

    expect(screen.getByText('You selected 2 days.')).toBeInTheDocument();
    expect(gridCell(today, true)).toHaveAttribute('aria-selected', 'true');
    expect(gridCell(tomorrow, true)).toHaveAttribute('aria-selected', 'true');
  });

  it('removes a day from the selection when the same date is clicked again', () => {
    fireEvent.click(dateButton(today)); // Select the date
    fireEvent.click(dateButton(today)); // Deselect the same date

    expect(screen.getByText('Please pick one or more days.')).toBeInTheDocument();
    expect(gridCell(today, true)).not.toHaveAttribute('aria-selected', 'true');
  });

  it('resets the selected days when the reset button is clicked', () => {
    fireEvent.click(dateButton(today)); // Select the date

    const resetButton = screen.getByText('Reset');

    fireEvent.click(resetButton); // Click reset

    expect(screen.getByText('Please pick one or more days.')).toBeInTheDocument();
    expect(gridCell(today, true)).not.toHaveAttribute('aria-selected', 'true');
  });
});
