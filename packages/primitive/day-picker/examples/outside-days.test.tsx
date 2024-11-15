import { render, screen } from '@testing-library/react';

import { labelGridcell } from '@/lib';

import { gridcell } from './lib/elements';
import { OutsideDays } from './outside-days';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('outside-days component', () => {
  beforeEach(() => {
    render(<OutsideDays />);
  });

  describe('when displaying a month view with outside days enabled', () => {
    test('displays days from the previous month', () => {
      expect(gridcell(new Date(2021, 9, 31))).toBeInTheDocument(); // Ngày 31 tháng 10 là ngày ngoài tháng
    });

    test('displays today’s date within the month view', () => {
      expect(
        screen.getByRole('cell', {
          name: labelGridcell(today, {
            today: true,
          }),
        }),
      ).toBeInTheDocument();
    });
  });
});
