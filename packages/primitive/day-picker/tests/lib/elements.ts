import type { ByRoleOptions } from '@testing-library/react';

import { screen } from '@testing-library/react';

import { DayFlag, labelDayButton, labelGridcell, labelMonthDropdown, labelYearDropdown, SelectionState } from '@/lib';

/**
 * Retrieves an HTML element with the role of 'grid', optionally filtered by a given name.
 *
 * @param name - Optional parameter that specifies the accessible name of the grid element.
 * @returns The first HTML element with the role of 'grid' that matches the optional name, if provided.
 */
export function grid(name?: ByRoleOptions['name']): HTMLElement {
  return screen.getByRole('grid', { name });
}

/**
 * Return the parent element of the next button from the screen.
 */
export function nav(): HTMLElement {
  return screen.getByRole('navigation');
}

/**
 * Retrieves all HTML elements with the role of 'grid'.
 *
 * @returns An array of HTMLElements that represent the grids in the document.
 */
export function grids(): HTMLElement[] {
  return screen.getAllByRole('grid');
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
    return screen.getByRole('gridcell', {
      name: date.getDate().toString(),
    });
  }

  return screen.getByRole('gridcell', {
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
        [DayFlag.focused]: false,
        [DayFlag.hidden]: false,
        [DayFlag.outside]: false,
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

/**
 * Returns the currently focused element in the document.
 *
 * @throws Error Will throw an error if no element is currently focused.
 * @returns Element - The currently focused element.
 */
export function activeElement(): Element {
  if (!document.activeElement) {
    throw new Error('Could not find any focused element');
  }

  return document.activeElement;
}

/**
 * Retrieves the "Go to the Previous Month" button from the screen.
 * This button allows the user to navigate to the previous month in a calendar or date picker interface.
 *
 * @returns HTMLElement - The button element that, when activated, navigates to the previous month.
 */
export function previousButton(): HTMLElement {
  return screen.getByRole('button', {
    name: 'Go to the Previous Month',
  });
}

/**
 * Retrieves the "Go to the Next Month" button from the screen.
 * This button allows the user to navigate to the next month in a calendar or date picker interface.
 *
 * @returns HTMLElement - The button element that, when activated, navigates to the next month.
 */
export function nextButton(): HTMLElement {
  return screen.getByRole('button', {
    name: 'Go to the Next Month',
  });
}

/**
 * Retrieves a table column header element based on the specified name options.
 *
 * @param name - (Optional) The name options used to query the column header.
 * It must conform to the ByRoleOptions["name"] type.
 * @returns The first HTMLElement that matches the role "columnheader" and the specified name options.
 */
export function columnHeader(name?: ByRoleOptions['name']): HTMLElement {
  return screen.getByRole('columnheader', { hidden: true, name });
}

/**
 * Return the rowheader element from the screen.
 *
 * @param name - The name of the rowheader.
 */
export function rowheader(name?: ByRoleOptions['name']): HTMLElement {
  return screen.getByRole('rowheader', { name });
}
