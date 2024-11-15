import { render, screen } from '@testing-library/react';

import { WeekNumberCustom } from './week-number-custom';

describe('weekNumberCustom component', () => {
  beforeEach(() => {
    render(<WeekNumberCustom />);
  });

  test('should display the 1st week (even if December)', () => {
    expect(screen.getByRole('rowheader', { name: `W1` })).toBeInTheDocument();
  });
});
