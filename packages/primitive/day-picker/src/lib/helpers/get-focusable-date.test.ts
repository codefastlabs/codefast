// Adjust the import path
import {
  type Locale,
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfISOWeek,
  endOfWeek,
  startOfISOWeek,
  startOfWeek,
} from 'date-fns';

import { DateLib } from '@/lib/classes/date-lib';
import { getFocusableDate } from '@/lib/helpers/get-focusable-date';
import { type DayPickerProps, type MoveFocusBy, type MoveFocusDir } from '@/lib/types';

const focusedDate = new Date(2023, 0, 1); // Jan 1, 2023
const options: Pick<DayPickerProps, 'ISOWeek'> = {
  ISOWeek: false,
};
const dateLib = new DateLib({
  weekStartsOn: 0, // Sunday
});

const calendarStartMonth = new Date(2022, 0, 1); // Jan 1, 2022
const calendarEndMonth = new Date(2024, 0, 1); // Jan 1, 2024

const testCases: {
  expectedFn: (date: Date | number, amount: number) => Date;
  moveBy: MoveFocusBy;
  moveDir: MoveFocusDir;
}[] = [
  { expectedFn: addDays, moveBy: 'day', moveDir: 'after' },
  { expectedFn: addDays, moveBy: 'day', moveDir: 'before' },
  { expectedFn: addMonths, moveBy: 'month', moveDir: 'after' },
  { expectedFn: addMonths, moveBy: 'month', moveDir: 'before' },
  { expectedFn: addWeeks, moveBy: 'week', moveDir: 'after' },
  { expectedFn: addWeeks, moveBy: 'week', moveDir: 'before' },
  { expectedFn: addYears, moveBy: 'year', moveDir: 'after' },
  { expectedFn: addYears, moveBy: 'year', moveDir: 'before' },
];

for (const { expectedFn, moveBy, moveDir } of testCases) {
  test(`should move ${moveDir} by ${moveBy}`, () => {
    const expectedDate = expectedFn(focusedDate, moveDir === 'after' ? 1 : -1);
    const result = getFocusableDate(
      moveBy,
      moveDir,
      focusedDate,
      calendarStartMonth,
      calendarEndMonth,
      options,
      dateLib,
    );

    expect(result).toEqual(expectedDate);
  });
}

const weekTestCases: {
  expectedFn: (
    date: Date | number,
    options?: {
      locale?: Locale | undefined;
      weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
    },
  ) => Date;
  moveBy: MoveFocusBy;
  moveDir: MoveFocusDir;
}[] = [
  { expectedFn: endOfWeek, moveBy: 'endOfWeek', moveDir: 'after' },
  { expectedFn: startOfWeek, moveBy: 'startOfWeek', moveDir: 'after' },
];

for (const { expectedFn, moveBy, moveDir } of weekTestCases) {
  test(`should move ${moveDir} by ${moveBy}`, () => {
    const expectedDate = expectedFn(focusedDate);
    const result = getFocusableDate(
      moveBy,
      moveDir,
      focusedDate,
      calendarStartMonth,
      calendarEndMonth,
      options,
      dateLib,
    );

    expect(result).toEqual(expectedDate);
  });
}

const ISOWeekTestCases: {
  expectedFn: (date: Date | number) => Date;
  moveBy: MoveFocusBy;
  moveDir: MoveFocusDir;
}[] = [
  { expectedFn: endOfISOWeek, moveBy: 'endOfWeek', moveDir: 'after' },
  { expectedFn: startOfISOWeek, moveBy: 'startOfWeek', moveDir: 'after' },
];

for (const { expectedFn, moveBy, moveDir } of ISOWeekTestCases) {
  test(`should move ${moveDir} by ${moveBy} when ISOWeek is true`, () => {
    const expectedDate = expectedFn(focusedDate);
    const result = getFocusableDate(
      moveBy,
      moveDir,
      focusedDate,
      calendarStartMonth,
      calendarEndMonth,
      { ...options, ISOWeek: true },
      dateLib,
    );

    expect(result).toEqual(expectedDate);
  });
}

test('should not move before startMonth', () => {
  const result = getFocusableDate(
    'day',
    'before',
    new Date(2022, 0, 2),
    calendarStartMonth,
    calendarEndMonth,
    options,
    dateLib,
  );

  expect(result).toEqual(calendarStartMonth);
});

test('should not move after endMonth', () => {
  const result = getFocusableDate(
    'day',
    'after',
    new Date(2023, 11, 31),
    calendarStartMonth,
    calendarEndMonth,
    options,
    dateLib,
  );

  expect(result).toEqual(calendarEndMonth);
});
