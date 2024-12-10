import { render } from '@testing-library/react';

import { DefaultMonth } from '~/default-month';
import { grid } from '~/lib/elements';

describe('default-month component', () => {
  test('renders the DayPicker component with December 1990 as the default month', () => {
    // Render the DefaultMonth component
    render(<DefaultMonth />);

    // Verify that DayPicker renders with December 1990 as the default month
    expect(grid('December 1990')).toBeInTheDocument();
  });
});
