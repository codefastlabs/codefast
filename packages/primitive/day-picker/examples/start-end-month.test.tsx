import { render } from '@testing-library/react';
import { differenceInMonths } from 'date-fns';

import { nextButton, previousButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { StartEndMonth } from './start-end-month';

function setup(): void {
  render(<StartEndMonth />);
}

describe('start-end-month component', () => {
  beforeEach(() => {
    setup();
  });

  test('disables the previous button on the start month', () => {
    expect(previousButton()).toHaveAttribute('disabled');
  });

  test('enables the next button on the start month', () => {
    expect(nextButton()).not.toHaveAttribute('disabled');
  });

  describe('when navigating to the end month', () => {
    const fromDate = new Date(2015, 5);
    const toDate = new Date(2015, 10);
    const numberOfMonths = differenceInMonths(toDate, fromDate);

    beforeEach(async () => {
      for (let i = 0; i < numberOfMonths; i++) {
        await user.click(nextButton());
      }
    });

    test('enables the previous button on the end month', () => {
      expect(previousButton()).not.toHaveAttribute('disabled');
    });

    test('disables the next button on the end month', () => {
      expect(nextButton()).toHaveAttribute('disabled');
    });
  });
});
