import { render } from '@testing-library/react';

import { gridcell } from '~/lib/elements';
import { ModifiersCustom } from '~/modifiers-custom';

const bookedDaysInRange = [
  new Date(2024, 5, 15),
  new Date(2024, 5, 16),
  new Date(2024, 5, 17),
  new Date(2024, 5, 18),
  new Date(2024, 5, 19),
  new Date(2024, 5, 20),
];

describe('modifiers-custom component', () => {
  test('renders without crashing', () => {
    const { container } = render(<ModifiersCustom />);

    expect(container).toBeInTheDocument();
  });

  test.each([
    new Date(2024, 5, 8),
    new Date(2024, 5, 9),
    new Date(2024, 5, 10),
    ...bookedDaysInRange,
  ])('applies the "booked" style to booked day %s', (day) => {
    render(<ModifiersCustom />);
    expect(gridcell(day, true)).toHaveClass('booked');
  });

  test.each([new Date(2024, 5, 1), new Date(2024, 5, 14), new Date(2024, 5, 21)])(
    'does not apply the "booked" style to unbooked day %s',
    (day) => {
      render(<ModifiersCustom />);
      expect(gridcell(day, true)).not.toHaveClass('booked');
    },
  );
});
