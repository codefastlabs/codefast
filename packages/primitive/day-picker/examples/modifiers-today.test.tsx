import { render } from '@testing-library/react';
import { subDays } from 'date-fns';

import { dateButton } from './lib/elements';
import { user } from './lib/user';
import { ModifiersToday } from './modifiers-today';

const today = new Date(); // Đặt ngày hôm nay để kiểm tra các hành vi với ngày hôm nay
const yesterday = subDays(today, 1); // Ngày trước hôm nay

beforeAll(() => {
  jest.setSystemTime(today); // Thiết lập thời gian cố định cho ngày hôm nay
});

afterAll(() => {
  jest.useRealTimers();
});

describe('modifiers-today component', () => {
  test('renders without crashing', () => {
    const { container } = render(<ModifiersToday />);

    expect(container).toBeInTheDocument();
  });

  test('displays initial footer text', () => {
    const { getByText } = render(<ModifiersToday />);

    expect(getByText('Try clicking the today’s date.')).toBeInTheDocument();
  });

  test('updates footer text when clicking today', async () => {
    const { getByText } = render(<ModifiersToday />);

    await user.click(dateButton(today));
    expect(getByText('You clicked the today’s date.')).toBeInTheDocument();
  });

  test('updates footer text when clicking a day that is not today', async () => {
    const { getByText } = render(<ModifiersToday />);

    await user.click(dateButton(yesterday));
    expect(getByText('This is not the today’s date.')).toBeInTheDocument();
  });
});
