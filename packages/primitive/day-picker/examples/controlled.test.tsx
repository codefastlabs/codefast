import { render, screen } from '@testing-library/react';

import { grid } from '@/tests/lib/elements';
import { user } from '@/tests/lib/user';

import { Controlled } from './controlled';

const today = new Date(2024, 10, 1);

beforeAll(() => {
  vi.setSystemTime(today);
});

afterAll(() => {
  vi.useRealTimers();
});

function setup(): void {
  render(<Controlled />);
}

describe('controlled component', () => {
  beforeEach(() => {
    setup();
  });

  test('renders with initial button properties', () => {
    const button = screen.getByRole('button', { name: /Go to Today/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({ all: 'unset', color: 'blue', cursor: 'pointer' });
    expect(button).toBeEnabled();
  });

  test('disables the button when the selected month is the current month', async () => {
    const button = screen.getByRole('button', { name: /Go to Today/i });

    await user.click(button);
    expect(button).toBeDisabled();
  });

  test('displays the current month name when "Go to Today" is clicked', async () => {
    const button = screen.getByRole('button', { name: /Go to Today/i });

    await user.click(button);
    expect(grid()).toHaveAccessibleName('November 2024');
  });
});
