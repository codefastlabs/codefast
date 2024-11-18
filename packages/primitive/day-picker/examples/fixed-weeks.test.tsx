import { render, screen } from '@testing-library/react';

import { FixedWeeks } from './fixed-weeks';

describe('fixed-weeks component', () => {
  render(<FixedWeeks />);

  test('should render 42*12 days', () => {
    expect(screen.getAllByRole('cell')).toHaveLength(42 * 12);
  });
});
