import { render, screen } from '@testing-library/react';
import { subDays } from 'date-fns';

import { dateButton } from '~/lib/elements';
import { user } from '~/lib/user';
import { ModifiersToday } from '~/modifiers-today';

const today = new Date(2024, 11, 27); // Set a date today to check the behaviors with today.
const yesterday = subDays(today, 1); // The day before today

beforeAll(() => {
  jest.setSystemTime(today); // Set a fixed time for today
});

afterAll(() => {
  jest.useRealTimers();
});

function setup(): void {
  render(<ModifiersToday />);
}

describe('modifiers-today component', () => {
  beforeEach(() => {
    setup();
  });

  test('displays initial footer text', () => {
    expect(screen.getByText('Try clicking the today’s date.')).toBeInTheDocument();
  });

  test('updates footer text when clicking today', async () => {
    await user.click(dateButton(today));
    expect(screen.getByText('You clicked the today’s date.')).toBeInTheDocument();
  });

  test('updates footer text when clicking a day that is not today', async () => {
    await user.click(dateButton(yesterday));
    expect(screen.getByText('This is not the today’s date.')).toBeInTheDocument();
  });
});
