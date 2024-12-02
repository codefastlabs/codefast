import { render } from '@testing-library/react';

import { gridcell } from '@/tests/lib/elements';

import { availableDays, ModifiersStyle } from './modifiers-style';

const style = {
  fontWeight: 900,
  color: 'lightgreen',
};

const today = new Date(2021, 10, 25);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('modifiers-style component', () => {
  test('should render without crashing', () => {
    const { container } = render(<ModifiersStyle />);

    expect(container).toBeInTheDocument();
  });

  test.each(availableDays)('applies available style to day %s', (day) => {
    render(<ModifiersStyle />);
    expect(gridcell(day, true)).toHaveStyle(style);
  });

  test('does not apply available style to a day not in availableDays', () => {
    render(<ModifiersStyle />);
    expect(gridcell(today, true)).not.toHaveStyle(style);
  });
});
