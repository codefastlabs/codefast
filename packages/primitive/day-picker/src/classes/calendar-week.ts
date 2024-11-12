import { type CalendarDay } from '@/classes/calendar-day';

/** Represent a week in a calendar month. */
export class CalendarWeek {
  /** The number of the week within the year. */
  weekNumber: number;
  /** The days within the week. */
  days: CalendarDay[];

  constructor(weekNumber: number, days: CalendarDay[]) {
    this.days = days;
    this.weekNumber = weekNumber;
  }
}
