import { render } from '@testing-library/react';

import { grid, nextButton, previousButton } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { Rtl } from './rtl';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<Rtl />);
}

describe('rtl component', () => {
  beforeEach(() => {
    setup();
  });

  test('should render with the "rtl" direction attribute', () => {
    // eslint-disable-next-line testing-library/no-node-access -- Testing the DOM
    const rootElement = document.querySelector('.rdp-root');

    expect(rootElement).toHaveAttribute('dir', 'rtl');
  });

  describe('when clicking the next month button', () => {
    test('should display the next month in RTL locale', async () => {
      await user.click(nextButton());
      expect(grid()).toHaveAccessibleName('ديسمبر 2021'); // December in Arabic
    });
  });

  describe('when clicking the previous month button', () => {
    test('should display the previous month in RTL locale', async () => {
      await user.click(previousButton());
      expect(grid()).toHaveAccessibleName('أكتوبر 2021'); // October in Arabic
    });
  });
});
