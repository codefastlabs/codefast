import { render } from '@testing-library/react';

import { ControlledSelection } from '~/controlled-selection';
import { dateButton, gridcell } from '~/lib/elements';
import { user } from '~/lib/user';

const today = new Date(2024, 11, 13);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('controlled-selection component', () => {
  test('selects a date range after clicking two dates', async () => {
    render(<ControlledSelection />);

    const startDate = new Date(2024, 11, 1);
    const endDate = new Date(2024, 11, 4);

    await user.click(dateButton(startDate));
    await user.click(dateButton(endDate));

    // Verify that each date within the range is selected
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      expect(gridcell(new Date(date), true)).toHaveAttribute('aria-selected', 'true');
    }

    expect(gridcell(new Date(2024, 11, 5), true)).not.toHaveAttribute('aria-selected', 'true');
  });

  test('resets the selected date range after clicking a third date', async () => {
    render(<ControlledSelection />);

    const startDate = new Date(2024, 11, 1);
    const endDate = new Date(2024, 11, 4);
    const resetDate = new Date(2024, 11, 5);

    await user.click(dateButton(startDate));
    await user.click(dateButton(endDate));
    await user.click(dateButton(resetDate));

    // Verify no dates in the original range are selected
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      expect(gridcell(new Date(date), true)).not.toHaveAttribute('aria-selected', 'true');
    }

    // Verify that only the reset date is selected
    expect(gridcell(resetDate, true)).toHaveAttribute('aria-selected', 'true');
    expect(gridcell(new Date(2024, 11, 6), true)).not.toHaveAttribute('aria-selected', 'true');
  });
});
