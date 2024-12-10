import { render, screen } from '@testing-library/react';
import { endOfMonth, startOfMonth } from 'date-fns';

import { DisableNavigation } from './disable-navigation';

import { grid, gridcell } from '~/lib/elements';
import { user } from '~/lib/user';

const today = new Date();

function setup(): void {
  render(<DisableNavigation />);
}

describe('disable-navigation component', () => {
  beforeEach(() => {
    setup();
  });

  test('should not display the navigation buttons', () => {
    expect(screen.getByRole('button', { name: /previous month/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next month/i })).toBeDisabled();
  });

  test('should keep the current month displayed when navigating left on the first day of the month', async () => {
    const currentMonth = grid().getAttribute('aria-label');
    const firstDay = gridcell(startOfMonth(today));

    await user.click(firstDay);
    await user.type(screen.getByRole('grid'), '{ArrowLeft}');
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe(currentMonth);
  });

  test('should keep the current month displayed when navigating right on the last day of the month', async () => {
    const currentMonth = grid().getAttribute('aria-label');
    const lastDay = gridcell(endOfMonth(today));

    await user.click(lastDay);
    await user.type(screen.getByRole('grid'), '{ArrowRight}');
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe(currentMonth);
  });
});
