import { render } from '@testing-library/react';

import { grids, previousButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { MultipleMonths } from './multiple-months';

const today = new Date(2023, 11, 3);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<MultipleMonths />);
}

describe('multiple-months component', () => {
  beforeEach(() => {
    setup();
  });

  test('renders 2 grids representing two consecutive months', () => {
    expect(grids()).toHaveLength(2);
  });

  test('displays the current month in the first grid', () => {
    expect(grids()[0]).toHaveAccessibleName('December 2023');
  });

  test('displays the next month in the second grid', () => {
    expect(grids()[1]).toHaveAccessibleName('January 2024');
  });

  describe('when the previous month button is clicked', () => {
    beforeEach(async () => {
      await user.click(previousButton());
    });

    test('updates the first grid to show the previous month', () => {
      expect(grids()[0]).toHaveAccessibleName('November 2023');
    });

    test('updates the second grid to show the original current month', () => {
      expect(grids()[1]).toHaveAccessibleName('December 2023');
    });
  });
});
