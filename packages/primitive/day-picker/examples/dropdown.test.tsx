import { render, within } from '@testing-library/react';

import { Dropdown } from '~/dropdown';
import { grid, monthDropdown, yearDropdown } from '~/lib/elements';
import { user } from '~/lib/user';

function setup(): void {
  render(<Dropdown />);
}

describe('dropdown component', () => {
  beforeEach(() => {
    setup();
  });

  test('renders month and year dropdowns on initial load', () => {
    expect(monthDropdown()).toBeInTheDocument();
    expect(yearDropdown()).toBeInTheDocument();
  });

  test('disables months that are outside the selectable range', () => {
    expect(within(monthDropdown()).getByRole('option', { name: 'January' })).toBeDisabled();
  });

  describe('when a month is selected', () => {
    const monthName = 'December';

    beforeEach(async () => {
      await user.selectOptions(monthDropdown(), monthName);
    });

    test('displays the selected month and current year in the calendar grid', () => {
      expect(grid()).toHaveAccessibleName(`${monthName} 2024`);
    });

    test('disables years that are outside the selectable range', () => {
      expect(within(yearDropdown()).getByRole('option', { name: '2025' })).toBeDisabled();
    });
  });

  describe('when a year is selected', () => {
    const year = '2025';

    beforeEach(async () => {
      await user.selectOptions(yearDropdown(), year);
    });

    test('displays the selected year and current month in the calendar grid', () => {
      expect(grid()).toHaveAccessibleName(`July ${year}`);
    });

    test('excludes years outside the range, such as 2026, from the year dropdown', () => {
      expect(within(yearDropdown()).queryByRole('option', { name: '2026' })).toBeNull();
    });
  });

  describe('when an unavailable month is selected', () => {
    const monthName = 'January';

    beforeEach(async () => {
      await user.selectOptions(monthDropdown(), monthName);
    });

    test('displays the first available month in the calendar grid', () => {
      expect(grid()).toHaveAccessibleName(`July 2024`);
    });
  });
});
