import { render, screen } from '@testing-library/react';

import { ModifiersHidden } from './modifiers-hidden';

const today = new Date(2022, 5, 10);

beforeAll(() => {
  jest.setSystemTime(today);
});
afterAll(() => {
  jest.useRealTimers();
});

const hiddenDays = [new Date(2022, 5, 10), new Date(2022, 5, 20), new Date(2022, 5, 11)];
// Một ngày không nằm trong hiddenDays để kiểm tra
const visibleDay = new Date(2022, 5, 15);

describe('modifiers-hidden component', () => {
  test('renders without crashing', () => {
    const { container } = render(<ModifiersHidden />);

    expect(container).toBeInTheDocument();
  });

  test.each(hiddenDays)('does not render the hidden day %s', (day) => {
    render(<ModifiersHidden />);
    expect(screen.queryByRole('cell', { name: `${day.getDate()}` })).not.toBeInTheDocument();
  });

  test('renders non-hidden days', () => {
    render(<ModifiersHidden />);
    const visibleElement = screen.getByText(visibleDay.getDate().toString());

    // Xác nhận rằng ngày không bị ẩn hiển thị trong DOM
    expect(visibleElement).toBeInTheDocument();
  });

  test('sets the default month to the month of the first hidden day', () => {
    const { container } = render(<ModifiersHidden />);
    const defaultMonthLabel = container.querySelector(`[aria-label="June 2022"]`);

    // Xác nhận rằng tháng mặc định là tháng của ngày đầu tiên trong hiddenDays
    expect(defaultMonthLabel).toBeInTheDocument();
  });
});
