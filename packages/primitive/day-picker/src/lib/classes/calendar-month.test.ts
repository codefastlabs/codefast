import { CalendarDay } from '@/lib/classes/calendar-day';
import { CalendarMonth } from '@/lib/classes/calendar-month';
import { CalendarWeek } from '@/lib/classes/calendar-week';

let month: CalendarMonth;
let date: Date;
let weeks: CalendarWeek[];
const days1 = [
  new CalendarDay(new Date(2023, 1, 12), new Date(2023, 1, 1)),
  new CalendarDay(new Date(2023, 1, 2023), new Date(2023, 1, 1)),
];
const days2 = [
  new CalendarDay(new Date(2023, 1, 12), new Date(2023, 1, 1)),
  new CalendarDay(new Date(2023, 1, 2023), new Date(2023, 1, 1)),
];

beforeEach(() => {
  date = new Date();
  weeks = [new CalendarWeek(1, days1), new CalendarWeek(2, days2)];
  month = new CalendarMonth(date, weeks);
});

test('should have a date property', () => {
  expect(month.date).toEqual(date);
});

test('should have a weeks property', () => {
  expect(month.weeks).toEqual(weeks);
});
