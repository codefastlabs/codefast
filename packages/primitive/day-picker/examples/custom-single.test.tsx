import { render, screen } from '@testing-library/react';

import { CustomSingle } from './custom-single';
import { dateButton, gridcell } from './lib/elements';
import { user } from './lib/user';

const today = new Date();

describe('custom-single component', () => {
  beforeEach(() => {
    render(<CustomSingle />);
  });

  test('renders correctly with no selected date', () => {
    expect(screen.queryByText(/You selected/)).toBeNull();
  });

  test('displays the selected date when a day is clicked', async () => {
    await user.click(dateButton(today));

    // Check the displayed date and the aria-selected status.
    expect(screen.getByText(`You selected ${today.toDateString()}`)).toBeInTheDocument();
    expect(gridcell(today, true)).toHaveAttribute('aria-selected', 'true');
  });

  test('clears the selected date when the same day is clicked again', async () => {
    await user.click(dateButton(today)); // Select date
    expect(screen.getByText(`You selected ${today.toDateString()}`)).toBeInTheDocument();

    await user.click(dateButton(today)); // Deselect the same day
    expect(screen.queryByText(/You selected/)).toBeNull();
  });
});
