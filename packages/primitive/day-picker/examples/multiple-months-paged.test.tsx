import { render } from '@testing-library/react';

import { grids, previousButton } from './lib/elements';
import { user } from './lib/user';
import { MultipleMonthsPaged } from './multiple-months-paged';

const today = new Date(2021, 10, 25); // Ngày hiện tại là 25/11/2021

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<MultipleMonthsPaged />);
}

describe('multiple-months-paged component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when the initial month is November 2021', () => {
    test('renders 2 grids representing two consecutive months', () => {
      expect(grids()).toHaveLength(2);
    });

    test('displays November 2021 in the first grid', () => {
      expect(grids()[0]).toHaveAccessibleName('November 2021');
    });

    test('displays December 2021 in the second grid', () => {
      expect(grids()[1]).toHaveAccessibleName('December 2021');
    });

    describe('when the previous month button is clicked', () => {
      beforeEach(async () => {
        await user.click(previousButton());
      });

      test('displays September 2021 in the first grid after paging', () => {
        expect(grids()[0]).toHaveAccessibleName('September 2021');
      });

      test('displays October 2021 in the second grid after paging', () => {
        expect(grids()[1]).toHaveAccessibleName('October 2021');
      });
    });
  });
});
