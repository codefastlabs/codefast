import { render } from '@testing-library/react';
import { differenceInMonths } from 'date-fns';

import { nextButton, previousButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { StartEndYear } from './start-end-year';

const fromMonth = new Date(2024, 0);
const toMonth = new Date(2026, 11);
const today = new Date(2025, 10, 25);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<StartEndYear />);
}

describe('start-end-year', () => {
  beforeEach(() => {
    setup();
  });

  test('disables the previous month button on the start month', () => {
    expect(previousButton()).toHaveAttribute('disabled');
  });

  test('enables the next month button on the start month', () => {
    expect(nextButton()).not.toHaveAttribute('disabled');
  });

  describe('when navigating to the end month', () => {
    const numberOfMonths = differenceInMonths(toMonth, fromMonth);

    beforeEach(async () => {
      for (let i = 0; i < numberOfMonths; i++) {
        await user.click(nextButton());
      }
    });

    test('enables the previous month button on the end month', () => {
      expect(previousButton()).not.toHaveAttribute('disabled');
    });

    test('disables the next month button on the end month', () => {
      expect(nextButton()).toHaveAttribute('disabled');
    });
  });
});
