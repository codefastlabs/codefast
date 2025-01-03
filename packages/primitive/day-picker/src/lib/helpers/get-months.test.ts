import type { DayPickerProps } from '@/lib/types';

import { CalendarMonth } from '@/lib/classes';
import { DateLib } from '@/lib/classes/date-lib';
import { getMonths } from '@/lib/helpers/get-months';

const mockDates = [
  new Date(2023, 4, 27), // May 1, 2023
  new Date(2023, 5, 1), // June 1, 2023
  new Date(2023, 5, 8), // June 2, 2023
  new Date(2023, 5, 15), // June 15, 2023
  new Date(2023, 5, 22), // June 22, 2023
  new Date(2023, 5, 30), // June 30, 2023
  new Date(2023, 6, 6), // June 30, 2023
];

const mockProps: Pick<DayPickerProps, 'fixedWeeks' | 'ISOWeek' | 'reverseMonths'> = {
  fixedWeeks: false,
  ISOWeek: false,
  reverseMonths: false,
};

const dateLib = new DateLib({
  firstWeekContainsDate: 1,
  weekStartsOn: 0, // Sunday
});

test('should return the correct months without ISO weeks and reverse months', () => {
  const displayMonths = [new Date(2023, 5, 1)]; // June 2023

  const result = getMonths(displayMonths, mockDates, mockProps, dateLib);

  expect(result).toHaveLength(1);
  expect(result[0]).toBeInstanceOf(CalendarMonth);
  expect(result[0]?.weeks).toHaveLength(5); // June 2023 has 5 weeks
});

test('should handle ISO weeks', () => {
  const displayMonths = [new Date(2023, 5, 1)]; // June 2023

  const isoProps = { ...mockProps, ISOWeek: true };

  const result = getMonths(displayMonths, mockDates, isoProps, dateLib);

  expect(result).toHaveLength(1);
  expect(result[0]).toBeInstanceOf(CalendarMonth);
  expect(result[0]?.weeks).toHaveLength(5); // June 2023 has 5 ISO weeks
});

test('should handle reverse months', () => {
  const displayMonths = [
    new Date(2023, 4, 1), // May 2023
    new Date(2023, 5, 1), // June 2023
  ];

  const reverseProps = { ...mockProps, reverseMonths: true };

  const result = getMonths(displayMonths, mockDates, reverseProps, dateLib);

  expect(result).toHaveLength(2);
  expect(result[0]?.date).toEqual(new Date(2023, 5, 1)); // June 2023
  expect(result[1]?.date).toEqual(new Date(2023, 4, 1)); // May 2023
});

test('should handle fixed weeks', () => {
  const displayMonths = [new Date(2023, 5, 1)]; // June 2023

  const fixedWeeksProps = { ...mockProps, fixedWeeks: true };

  const result = getMonths(displayMonths, mockDates, fixedWeeksProps, dateLib);

  expect(result).toHaveLength(1);
  expect(result[0]).toBeInstanceOf(CalendarMonth);
  expect(result[0]?.weeks).toHaveLength(6); // Fixed weeks should ensure 6 weeks in the month view
});

test('should handle months with no dates', () => {
  const displayMonths = [new Date(2023, 5, 1)]; // June 2023

  const result = getMonths(displayMonths, [], mockProps, dateLib);

  expect(result).toHaveLength(1);
  expect(result[0]).toBeInstanceOf(CalendarMonth);
  expect(result[0]?.weeks).toHaveLength(0); // No dates should result in no weeks
});
