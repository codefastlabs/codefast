import { render } from '@testing-library/react';

import { grid } from './lib/elements';
import { Spanish } from './spanish';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('spanish component', () => {
  beforeEach(() => {
    render(<Spanish />);
  });

  describe('when rendering the calendar', () => {
    test('localizes the caption in Spanish', () => {
      expect(grid()).toHaveAccessibleName('noviembre 2021');
    });
  });
});
