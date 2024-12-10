import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';

import { Input } from '~/input';
import { user } from '~/lib/user';

function textbox(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Date:' });
}

function gridcells(): HTMLElement[] {
  return screen.queryAllByRole('gridcell');
}

function selectedCells(): HTMLElement[] {
  return gridcells().filter((cell) => cell.hasAttribute('aria-selected'));
}

function setup(): void {
  render(<Input />);
}

describe('input component', () => {
  beforeEach(() => {
    setup();
  });

  test('displays the selected date in the calendar when a valid date is typed in', async () => {
    const testDate = new Date(2022, 11, 31); // Dec 31, 2022

    await user.type(textbox(), format(testDate, 'MM/dd/yyyy'));

    expect(screen.getByText(`Selected: ${testDate.toDateString()}`)).toBeInTheDocument();
    expect(selectedCells()).toHaveLength(1);
    expect(selectedCells()[0]).toHaveTextContent(`${testDate.getDate()}`);
  });

  test('displays the selected day in the input field when a date is picked from the calendar', async () => {
    const testDate = new Date(2022, 11, 31); // Dec 31, 2022

    await user.type(textbox(), format(testDate, 'MM/dd/yyyy'));

    expect(screen.getByText(`Selected: ${testDate.toDateString()}`)).toBeInTheDocument();
    expect(selectedCells()).toHaveLength(1);
    expect(selectedCells()[0]).toHaveTextContent(`${testDate.getDate()}`);
  });

  test('clears the selected date when an invalid date is entered', async () => {
    await user.type(textbox(), 'invalid date');
    expect(selectedCells()).toHaveLength(0);
  });

  test('displays the corresponding month in the calendar when a date is typed in', async () => {
    const testDate = new Date(2022, 11, 31); // Dec 31, 2022

    await user.type(textbox(), format(testDate, 'MM/dd/yyyy'));

    expect(screen.getByText(`December 2022`)).toBeInTheDocument();
  });

  test('clears the selected date when the input field is emptied', async () => {
    const testDate = new Date(2022, 11, 31); // Dec 31, 2022

    await user.type(textbox(), format(testDate, 'MM/dd/yyyy'));
    await user.clear(textbox());

    expect(selectedCells()).toHaveLength(0);
  });
});
