import { type ByRoleOptions, screen } from '@testing-library/react';

import { DayFlag, labelDayButton, labelGridcell, labelMonthDropdown, labelYearDropdown, SelectionState } from '@/lib';

/**
 * Retrieves an HTML element with the role of 'grid', optionally filtered by a given name.
 *
 * @param name - Optional parameter that specifies the accessible name of the grid element.
 * @returns The first HTML element with the role of 'grid' that matches the optional name, if provided.
 */
export function grid(name?: ByRoleOptions['name']): HTMLElement {
  return screen.getByRole('grid', name ? { name } : undefined);
}

/**
 * Retrieves a gridcell element corresponding to the given date.
 *
 * @param date - The date for which the grid cell is being retrieved.
 * @param interactive - Optional. A boolean indicating whether the cell is interactive. Defaults to false.
 * @returns The HTMLElement representing the grid cell matching the specified date.
 */
export function gridcell(date: Date, interactive?: boolean): HTMLElement {
  if (interactive) {
    return screen.getByRole('cell', {
      name: date.getDate().toString(),
    });
  }

  return screen.getByRole('cell', {
    name: labelGridcell(date),
  });
}

/**
 * Retrieves an HTML button element corresponding to a given date.
 *
 * @param date - The date for which the button should be found.
 * @returns The HTML button element that matches the date criteria.
 */
export function dateButton(date: Date): HTMLElement {
  return screen.getByRole('button', {
    name: new RegExp(
      labelDayButton(date, {
        [DayFlag.disabled]: false,
        [DayFlag.hidden]: false,
        [DayFlag.outside]: false,
        [DayFlag.focused]: false,
        [DayFlag.today]: false,
        [SelectionState.range_end]: false,
        [SelectionState.range_middle]: false,
        [SelectionState.range_start]: false,
        [SelectionState.selected]: false,
      }),
      's',
    ),
  });
}

/**
 * Retrieves the dropdown element for selecting the year.
 *
 * @returns The HTML element representing the year dropdown.
 */
export function yearDropdown(): HTMLElement {
  return screen.getByRole('combobox', { name: labelYearDropdown() });
}

/**
 * Generates and returns the month dropdown element.
 *
 * @returns The HTML element representing the month dropdown.
 */
export function monthDropdown(): HTMLElement {
  return screen.getByRole('combobox', { name: labelMonthDropdown() });
}
