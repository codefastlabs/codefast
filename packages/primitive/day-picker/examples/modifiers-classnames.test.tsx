import { render } from '@testing-library/react';

import { gridcell } from './lib/elements';
import { bookedDays, ModifiersClassnames } from './modifiers-classnames';

const today = new Date(2021, 10, 25);

beforeAll(() => {
  jest.setSystemTime(today);
});
afterAll(() => {
  return jest.useRealTimers();
});

describe('modifiers-classnames component', () => {
  test('renders without crashing', () => {
    const { container } = render(<ModifiersClassnames />);

    expect(container).toBeInTheDocument();
  });

  test('applies the `my-booked-class` class to booked days', () => {
    const { container } = render(<ModifiersClassnames />);
    const bookedElements = container.querySelectorAll('.my-booked-class');

    expect(bookedElements.length).toBeGreaterThan(0);
  });

  test('includes a style tag with custom styles', () => {
    const { container } = render(<ModifiersClassnames />);
    const styleTag = container.querySelector('style');

    expect(styleTag).toBeInTheDocument();
  });

  test.each(bookedDays)('adds the `my-booked-class` class to the day %s', (day) => {
    render(<ModifiersClassnames />);
    expect(gridcell(day)).toHaveClass('my-booked-class');
  });
});