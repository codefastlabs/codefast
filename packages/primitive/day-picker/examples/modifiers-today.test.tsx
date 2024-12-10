import { render, screen } from '@testing-library/react';
import { subDays } from 'date-fns';

import { dateButton } from '~/lib/elements';
import { user } from '~/lib/user';

import { ModifiersToday } from './modifiers-today';

const today = new Date(); // Đặt ngày hôm nay để kiểm tra các hành vi với ngày hôm nay
const yesterday = subDays(today, 1); // Ngày trước hôm nay

beforeAll(() => {
  jest.setSystemTime(today); // Thiết lập thời gian cố định cho ngày hôm nay
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<ModifiersToday />);
}

describe('modifiers-today component', () => {
  beforeEach(() => {
    setup();
  });

  test('displays initial footer text', () => {
    expect(screen.getByText('Try clicking the today’s date.')).toBeInTheDocument();
  });

  test('updates footer text when clicking today', async () => {
    await user.click(dateButton(today));
    expect(screen.getByText('You clicked the today’s date.')).toBeInTheDocument();
  });

  test('updates footer text when clicking a day that is not today', async () => {
    await user.click(dateButton(yesterday));
    expect(screen.getByText('This is not the today’s date.')).toBeInTheDocument();
  });
});
