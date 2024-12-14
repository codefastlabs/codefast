import { render, screen } from '@testing-library/react';

import { labelMonthDropdown } from '@/lib';
import { DropdownMultipleMonths } from '~/dropdown-multiple-months';
import { grid } from '~/lib/elements';
import { user } from '~/lib/user';

const today = new Date(2023, 9, 16);

beforeAll(() => {
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<DropdownMultipleMonths />);
}

describe('dropdown-multiple-months component', () => {
  beforeEach(() => {
    setup();
  });

  describe('when selecting a month from the first dropdown', () => {
    const monthName = 'January';

    beforeEach(async () => {
      const firstDropDown = screen.getAllByRole('combobox', {
        name: labelMonthDropdown(),
      })[0];

      await user.selectOptions(firstDropDown, monthName);
    });

    test('displays the selected month in the first calendar grid', () => {
      expect(grid(`${monthName} 2023`)).toBeInTheDocument();
    });
  });

  describe('when selecting a month from the third dropdown', () => {
    const monthName = 'October';

    beforeEach(async () => {
      const thirdDropDown = screen.getAllByRole('combobox', {
        name: labelMonthDropdown(),
      })[2];

      await user.selectOptions(thirdDropDown, monthName);
    });

    test('displays the selected month in the third calendar grid', () => {
      expect(grid(`${monthName} 2023`)).toBeInTheDocument();
    });
  });
});
