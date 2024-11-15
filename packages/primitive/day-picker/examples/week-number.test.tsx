import { render, screen } from '@testing-library/react';

import { WeekNumber } from './week-number';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

function getWeek(week: number): HTMLElement {
  return screen.getByRole('rowheader', {
    name: `Week ${week}`,
  });
}

describe('weekNumber component', () => {
  beforeEach(() => render(<WeekNumber />).container);

  describe('when displaying November 2021', () => {
    test('should display the 45th week number', () => {
      expect(getWeek(45)).toBeInTheDocument();
    });
  });
});
