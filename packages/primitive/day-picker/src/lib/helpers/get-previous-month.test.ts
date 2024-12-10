import { defaultDateLib } from '@/lib/classes/date-lib';
import { getPreviousMonth } from '@/lib/helpers/get-previous-month';

test('should return undefined if navigation is disabled', () => {
  const firstDisplayedMonth = new Date(2022, 0, 1); // January 2022
  const calendarStartMonth = new Date(2022, 0, 1); // January 2022
  const props = {
    disableNavigation: true,
    numberOfMonths: 1,
    pagedNavigation: false,
  };

  const result = getPreviousMonth(firstDisplayedMonth, calendarStartMonth, props, defaultDateLib);

  expect(result).toBeUndefined();
});

test('should return the previous month if startMonth is not provided', () => {
  const firstDisplayedMonth = new Date(2022, 1, 1); // February 2022
  const props = {
    disableNavigation: false,
    numberOfMonths: 1,
    pagedNavigation: false,
  };

  const result = getPreviousMonth(firstDisplayedMonth, undefined, props, defaultDateLib);

  expect(result).toEqual(new Date(2022, 0, 1)); // January 2022
});

test('should return undefined if the previous month is before the startMonth', () => {
  const firstDisplayedMonth = new Date(2022, 0, 1); // January 2022
  const calendarStartMonth = new Date(2022, 0, 1); // January 2022
  const props = {
    disableNavigation: false,
    numberOfMonths: 1,
    pagedNavigation: false,
  };
  const result = getPreviousMonth(firstDisplayedMonth, calendarStartMonth, props, defaultDateLib);

  expect(result).toBeUndefined();
});

test('should return the correct previous month when pagedNavigation is true', () => {
  const firstDisplayedMonth = new Date(2022, 2, 1); // March 2022
  const calendarStartMonth = new Date(2022, 0, 1); // January 2022
  const props = {
    disableNavigation: false,
    numberOfMonths: 2,
    pagedNavigation: true,
    startMonth: new Date(2022, 0, 1),
  };

  const result = getPreviousMonth(firstDisplayedMonth, calendarStartMonth, props, defaultDateLib);

  expect(result).toEqual(new Date(2022, 0, 1)); // January 2022
});
