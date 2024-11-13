import { fireEvent, render, screen } from '@testing-library/react';
import { endOfMonth, startOfMonth } from 'date-fns';

import { DisableNavigation } from './disable-navigation';
import { grid, gridcell } from './lib/elements';

const today = new Date();

describe('disable-navigation component', () => {
  beforeEach(() => {
    render(<DisableNavigation />);
  });

  it('should not display the navigation buttons', () => {
    expect(screen.getByRole('button', { name: /previous month/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next month/i })).toBeDisabled();
  });

  it('should keep the current month displayed when navigating left on the first day of the month', () => {
    const currentMonth = grid().getAttribute('aria-label');
    const firstDay = gridcell(startOfMonth(today));

    fireEvent.click(firstDay);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowLeft' });
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe(currentMonth);
  });

  it('should keep the current month displayed when navigating right on the last day of the month', () => {
    const currentMonth = grid().getAttribute('aria-label');
    const lastDay = gridcell(endOfMonth(today));

    fireEvent.click(lastDay);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' });
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe(currentMonth);
  });
});
