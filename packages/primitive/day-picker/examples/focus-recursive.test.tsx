import { render } from '@testing-library/react';

import { activeElement, dateButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { FocusRecursive } from './focus-recursive';

const today = new Date(2022, 5, 10);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('focus-recursive component', () => {
  test('renders component without crashing', () => {
    const { container } = render(<FocusRecursive />);

    expect(container).toBeInTheDocument();
  });

  test('focuses on the correct day after navigating with ArrowDown', async () => {
    render(<FocusRecursive />);

    // Sử dụng phím tab ba lần để đưa focus đến ngày bắt đầu
    await user.tab();
    await user.tab();
    await user.tab();

    // Sử dụng phím mũi tên xuống để di chuyển focus đến ngày cần kiểm tra
    await user.type(activeElement(), '{ArrowDown}');
    await user.type(activeElement(), '{ArrowDown}');
    await user.type(activeElement(), '{ArrowDown}');
    await user.type(activeElement(), '{ArrowDown}');

    // Kiểm tra rằng ngày 22 tháng 6 năm 2022 có focus
    expect(dateButton(new Date(2022, 5, 22))).toHaveFocus();
  });
});
