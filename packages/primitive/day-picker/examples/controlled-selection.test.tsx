import { fireEvent, render } from '@testing-library/react';

import { ControlledSelection } from './controlled-selection';
import { dateButton, gridcell } from './lib/elements';

const today = new Date(2024, 11, 13);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('controlled-selection component', () => {
  it('selects a date range after clicking two dates', () => {
    render(<ControlledSelection />);

    const startDate = new Date(2024, 11, 1);
    const endDate = new Date(2024, 11, 4);

    fireEvent.click(dateButton(startDate));
    fireEvent.click(dateButton(endDate));

    // Verify that each date within the range is selected
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      expect(gridcell(new Date(date), true)).toHaveAttribute('aria-selected', 'true');
    }

    expect(gridcell(new Date(2024, 11, 5), true)).not.toHaveAttribute('aria-selected', 'true');
  });

  it('resets the selected date range after clicking a third date', () => {
    const logSpy = jest.spyOn(console, 'log');

    render(<ControlledSelection />);

    const startDate = new Date(2024, 11, 1);
    const endDate = new Date(2024, 11, 4);
    const resetDate = new Date(2024, 11, 5);

    fireEvent.click(dateButton(startDate));
    fireEvent.click(dateButton(endDate));
    fireEvent.click(dateButton(resetDate));

    // Verify reset action is logged
    expect(logSpy).toHaveBeenCalledWith('reset range');

    // Verify no dates in the original range are selected
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      expect(gridcell(new Date(date), true)).not.toHaveAttribute('aria-selected', 'true');
    }

    // Verify that only the reset date is selected
    expect(gridcell(resetDate, true)).toHaveAttribute('aria-selected', 'true');
    expect(gridcell(new Date(2024, 11, 6), true)).not.toHaveAttribute('aria-selected', 'true');

    logSpy.mockRestore();
  });
});
