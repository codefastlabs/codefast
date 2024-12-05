import { render } from '@testing-library/react';

import { dateButton } from '@/tests/lib/elements';

import { ModifiersDisabled } from './modifiers-disabled';

const today = new Date(2024, 10, 14);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

const disabledDays = [new Date(2024, 10, 9), new Date(2024, 10, 16), new Date(2024, 10, 23), new Date(2024, 10, 30)];
const enabledDays = [new Date(2024, 10, 8), new Date(2024, 10, 15), new Date(2024, 10, 22), new Date(2024, 10, 29)];

describe('modifiers-disabled component', () => {
  test('renders DayPicker with disabled days for Saturday and Sunday', () => {
    const { container } = render(<ModifiersDisabled />);

    expect(container).toBeInTheDocument();
  });

  test.each(disabledDays)('disables the weekend day %s', (day) => {
    render(<ModifiersDisabled />);
    expect(dateButton(day)).toBeDisabled();
  });

  test.each(enabledDays)('does not disable the weekday %s', (day) => {
    render(<ModifiersDisabled />);
    expect(dateButton(day)).toBeEnabled();
  });

  test('renders DayPicker with mode set to range', () => {
    const { container } = render(<ModifiersDisabled />);

    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container -- Testing the DOM
    const dayPicker = container.querySelector('[data-mode="range"]');

    expect(dayPicker).toBeInTheDocument();
  });
});
