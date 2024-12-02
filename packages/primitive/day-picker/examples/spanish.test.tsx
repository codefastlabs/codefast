import { render } from '@testing-library/react';

import { grid } from '@/tests/lib/elements';

import { Spanish } from './spanish';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<Spanish />);
}

describe('spanish component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when rendering the calendar', () => {
    test('localizes the caption in Spanish', () => {
      expect(grid()).toHaveAccessibleName('noviembre 2021');
    });
  });
});
