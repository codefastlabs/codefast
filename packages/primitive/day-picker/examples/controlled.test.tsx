import { fireEvent, render, screen } from '@testing-library/react';

import { Controlled } from './controlled';
import { grid } from './lib/elements';

beforeAll(() => {
  jest.setSystemTime(new Date(2024, 10, 1));
});
afterAll(() => {
  jest.useRealTimers();
});

describe('controlled component', () => {
  beforeEach(() => {
    render(<Controlled />);
  });

  it('renders with initial button properties', () => {
    const button = screen.getByRole('button', { name: /Go to Today/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({ all: 'unset', cursor: 'pointer', color: 'blue' });
    expect(button).toBeEnabled();
  });

  it('disables the button when the selected month is the current month', () => {
    const button = screen.getByRole('button', { name: /Go to Today/i });

    fireEvent.click(button);
    expect(button).toBeDisabled();
  });

  it('displays the current month name when "Go to Today" is clicked', () => {
    const button = screen.getByRole('button', { name: /Go to Today/i });

    fireEvent.click(button);
    expect(grid()).toHaveAccessibleName('November 2024');
  });
});
