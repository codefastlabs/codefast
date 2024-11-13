import { fireEvent, render, screen } from '@testing-library/react';

import { CustomSingle } from './custom-single';
import { dateButton, gridCell } from './lib/elements';

const today = new Date();

describe('custom-single component', () => {
  beforeEach(() => {
    render(<CustomSingle />);
  });

  it('renders correctly with no selected date', () => {
    expect(screen.queryByText(/You selected/)).toBeNull();
  });

  it('displays the selected date when a day is clicked', () => {
    fireEvent.click(dateButton(today));

    // Check the displayed date and the aria-selected status.
    expect(screen.getByText(`You selected ${today.toDateString()}`)).toBeInTheDocument();
    expect(gridCell(today, true)).toHaveAttribute('aria-selected', 'true');
  });

  it('clears the selected date when the same day is clicked again', () => {
    fireEvent.click(dateButton(today)); // Select date
    expect(screen.getByText(`You selected ${today.toDateString()}`)).toBeInTheDocument();

    fireEvent.click(dateButton(today)); // Deselect the same day
    expect(screen.queryByText(/You selected/)).toBeNull();
  });
});
