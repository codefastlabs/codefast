import { defaultDateLib } from '@/lib';
import { getBroadcastWeeksInMonth } from '@/lib/helpers/get-broadcast-weeks-in-month';

describe('getBroadcastWeeksInMonth', () => {
  // Dataset of test cases for all months in normal and leap years
  const testCases = [
    { description: 'January 2023', expectedWeeks: 5, month: new Date(2023, 0, 1) },
    { description: 'February 2023', expectedWeeks: 4, month: new Date(2023, 1, 1) },
    { description: 'March 2023', expectedWeeks: 4, month: new Date(2023, 2, 1) },
    { description: 'April 2023', expectedWeeks: 5, month: new Date(2023, 3, 1) },
    { description: 'May 2023', expectedWeeks: 4, month: new Date(2023, 4, 1) },
    { description: 'June 2023', expectedWeeks: 4, month: new Date(2023, 5, 1) },
    { description: 'July 2023', expectedWeeks: 5, month: new Date(2023, 6, 1) },
    { description: 'August 2023', expectedWeeks: 4, month: new Date(2023, 7, 1) },
    { description: 'September 2023', expectedWeeks: 4, month: new Date(2023, 8, 1) },
    { description: 'October 2023', expectedWeeks: 5, month: new Date(2023, 9, 1) },
    { description: 'November 2023', expectedWeeks: 4, month: new Date(2023, 10, 1) },
    { description: 'December 2023', expectedWeeks: 5, month: new Date(2023, 11, 1) },
  ];

  // Test for each defined case
  for (const { description, expectedWeeks, month } of testCases) {
    test(`returns ${expectedWeeks} weeks for ${description}`, () => {
      expect(getBroadcastWeeksInMonth(month, defaultDateLib)).toBe(expectedWeeks);
    });
  }

  test('getBroadcastWeeksInMonth should return correct number of weeks', () => {
    // Test for a month with 5 weeks
    expect(getBroadcastWeeksInMonth(new Date(2023, 0, 1), defaultDateLib)).toBe(5); // January 2023
    // Test for a month with 4 weeks
    expect(getBroadcastWeeksInMonth(new Date(2023, 1, 1), defaultDateLib)).toBe(4); // February 2023
  });
});
