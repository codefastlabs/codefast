import { render, screen } from '@testing-library/react';

import { dateButton, gridcell } from '~/lib/elements';
import { user } from '~/lib/user';

import { CustomMultiple } from './custom-multiple';

const today = new Date(2024, 11, 13);
const tomorrow = new Date(2024, 11, 14);

beforeAll(() => {
  jest.setSystemTime(today);
});

function setup(): void {
  render(<CustomMultiple />);
}

afterAll(() => {
  jest.useRealTimers();
});

describe('custom-multiple component', () => {
  beforeEach(() => {
    setup();
  });

  test('displays the initial footer text', () => {
    expect(screen.getByText('Please pick one or more days.')).toBeInTheDocument();
  });

  test('adds a day to the selection when a date is clicked', async () => {
    await user.click(dateButton(today));

    expect(screen.getByText('You selected 1 days.')).toBeInTheDocument();
    expect(gridcell(today, true)).toHaveAttribute('aria-selected', 'true');
  });

  test('adds another day to the selection when another date (tomorrow) is clicked', async () => {
    await user.click(dateButton(today));
    await user.click(dateButton(tomorrow));

    expect(screen.getByText('You selected 2 days.')).toBeInTheDocument();
    expect(gridcell(today, true)).toHaveAttribute('aria-selected', 'true');
    expect(gridcell(tomorrow, true)).toHaveAttribute('aria-selected', 'true');
  });

  test('removes a day from the selection when the same date is clicked again', async () => {
    await user.click(dateButton(today)); // Select the date
    await user.click(dateButton(today)); // Deselect the same date

    expect(screen.getByText('Please pick one or more days.')).toBeInTheDocument();
    expect(gridcell(today, true)).not.toHaveAttribute('aria-selected', 'true');
  });

  test('resets the selected days when the reset button is clicked', async () => {
    await user.click(dateButton(today)); // Select the date

    const resetButton = screen.getByText('Reset');

    await user.click(resetButton); // Click reset

    expect(screen.getByText('Please pick one or more days.')).toBeInTheDocument();
    expect(gridcell(today, true)).not.toHaveAttribute('aria-selected', 'true');
  });
});
