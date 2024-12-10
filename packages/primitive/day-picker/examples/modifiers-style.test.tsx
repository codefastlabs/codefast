import { render } from '@testing-library/react';

import { gridcell } from '~/lib/elements';
import { availableDays, ModifiersStyle } from '~/modifiers-style';

const style = {
  color: 'lightgreen',
  fontWeight: 900,
};

const today = new Date(2021, 10, 25);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
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
