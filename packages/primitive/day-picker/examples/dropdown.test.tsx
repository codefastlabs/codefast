import { within } from '@testing-library/dom';
import { fireEvent, render } from '@testing-library/react';

import { Dropdown } from './dropdown';
import { grid, monthDropdown, yearDropdown } from './lib/elements';

describe('dropdown component', () => {
  beforeEach(() => {
    render(<Dropdown />);
  });

  it('renders month and year dropdowns on initial load', () => {
    expect(monthDropdown()).toBeInTheDocument();
    expect(yearDropdown()).toBeInTheDocument();
  });

  it('disables months that are outside the selectable range', () => {
    expect(within(monthDropdown()).getByRole('option', { name: 'January' })).toBeDisabled();
  });

  describe('when a month is selected', () => {
    const monthName = 'December';

    beforeEach(() => {
      fireEvent.change(monthDropdown(), { target: { value: '11' } });
    });

    it('displays the selected month and current year in the calendar grid', () => {
      expect(grid()).toHaveAccessibleName(`${monthName} 2024`);
    });

    it('disables years that are outside the selectable range', () => {
      expect(within(yearDropdown()).getByRole('option', { name: '2025' })).toBeDisabled();
    });
  });

  describe('when a year is selected', () => {
    const year = '2025';

    beforeEach(() => {
      fireEvent.change(yearDropdown(), { target: { value: '2025' } });
    });

    it('displays the selected year and current month in the calendar grid', () => {
      expect(grid()).toHaveAccessibleName(`July ${year}`);
    });

    it('excludes years outside the range, such as 2026, from the year dropdown', () => {
      expect(within(yearDropdown()).queryByRole('option', { name: '2026' })).toBeNull();
    });
  });

  describe('when an unavailable month is selected', () => {
    beforeEach(() => {
      fireEvent.change(monthDropdown(), { target: { value: '1' } });
    });

    it('displays the first available month in the calendar grid', () => {
      expect(grid()).toHaveAccessibleName(`July 2024`);
    });
  });
});
