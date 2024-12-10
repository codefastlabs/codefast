import { render } from '@testing-library/react';

import { StartEndMonths } from './start-end-months';

import { grid, gridcell, nextButton } from '~/lib/elements';
import { user } from '~/lib/user';

function setup(): void {
  render(<StartEndMonths />);
}

describe('start-end-months component', () => {
  beforeEach(() => {
    setup();
  });

  test('the first month should be January 2024', () => {
    expect(grid('January 2024')).toBeInTheDocument();
    expect(gridcell(new Date(2024, 0, 31))).toBeInTheDocument();
  });

  describe('when navigating to the last month', () => {
    beforeEach(async () => {
      for (let i = 0; i < 24; i++) {
        await user.click(nextButton());
      }
    });

    test('the last month should be December 2025', () => {
      expect(grid('December 2025')).toBeInTheDocument();
      expect(gridcell(new Date(2025, 11, 31))).toBeInTheDocument();
    });
  });
});
