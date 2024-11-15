import { render, screen } from '@testing-library/react';

import { NumberingSystem } from './numbering-system';

const today = new Date(2024, 8, 19);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('numbering-system component', () => {
  beforeEach(() => {
    render(<NumberingSystem />);
  });

  test('displays days of the week in Arabic', () => {
    expect(screen.getByText('أربعاء')).toBeInTheDocument();
  });

  test('formats week numbers with Arabic numerals', () => {
    expect(screen.getByText('١٤')).toBeInTheDocument();
  });
});
