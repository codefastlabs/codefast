import { render, screen } from '@testing-library/react';

import { WeekNumber } from './week-number';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<WeekNumber />);
}

function getWeek(week: number): HTMLElement {
  return screen.getByRole('rowheader', {
    name: `Week ${week}`,
  });
}

describe('weekNumber component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when displaying November 2021', () => {
    test('should display the 45th week number', () => {
      expect(getWeek(45)).toBeInTheDocument();
    });
  });
});
