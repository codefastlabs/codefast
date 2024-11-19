import { render, screen } from '@testing-library/react';

import { WeekNumberCustom } from './week-number-custom';

function setup(): void {
  render(<WeekNumberCustom />);
}

describe('weekNumberCustom component', () => {
  beforeEach(() => {
    setup();
  });

  test('should display the 1st week (even if December)', () => {
    expect(screen.getByRole('rowheader', { name: `W1` })).toBeInTheDocument();
  });
});
