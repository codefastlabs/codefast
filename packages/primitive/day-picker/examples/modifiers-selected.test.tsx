import { fireEvent, render } from '@testing-library/react';
import { subDays } from 'date-fns';

import { dateButton } from '~/lib/elements';

import { ModifiersSelected } from './modifiers-selected';

const today = new Date(2024, 11, 5);
const yesterday = subDays(today, 1);

beforeAll(() => {
  jest.setSystemTime(today); // Thiết lập ngày cố định cho các test case
});

afterAll(() => {
  jest.useRealTimers(); // Reset lại thời gian sau khi hoàn thành các test case
});

describe('modifiers-selected component', () => {
  test('renders without crashing', () => {
    const { container } = render(<ModifiersSelected />);

    expect(container).toBeInTheDocument();
  });

  test('alerts when clicking the selected day (yesterday)', () => {
    window.alert = jest.fn(); // Mock alert

    render(<ModifiersSelected />);
    fireEvent.click(dateButton(yesterday));
    expect(window.alert).toHaveBeenCalledWith('You clicked a selected day.');
  });

  test('alerts when clicking today', () => {
    window.alert = jest.fn(); // Mock alert

    render(<ModifiersSelected />);
    fireEvent.click(dateButton(today));
    expect(window.alert).toHaveBeenCalledWith('You clicked today');
  });

  test('does not alert when clicking an unselected day that is not today', () => {
    window.alert = jest.fn(); // Mock alert

    const unselectedDay = subDays(today, 2); // Một ngày không phải hôm nay và không được chọn

    render(<ModifiersSelected />);
    fireEvent.click(dateButton(unselectedDay));
    expect(window.alert).not.toHaveBeenCalled();
  });
});
