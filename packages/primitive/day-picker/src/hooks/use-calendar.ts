import { useEffect } from 'react';

import { type CalendarWeek, type CalendarDay, type CalendarMonth, type DateLib } from '@/classes';
import { getDates } from '@/helpers/get-dates';
import { getDays } from '@/helpers/get-days';
import { getDisplayMonths } from '@/helpers/get-display-months';
import { getInitialMonth } from '@/helpers/get-initial-month';
import { getMonths } from '@/helpers/get-months';
import { getNavMonths } from '@/helpers/get-nav-month';
import { getNextMonth } from '@/helpers/get-next-month';
import { getPreviousMonth } from '@/helpers/get-previous-month';
import { getWeeks } from '@/helpers/get-weeks';
import { useControlledValue } from '@/hooks/use-controlled-value';
import { type DayPickerProps } from '@/types';

/**
 * Return the calendar object to work with the calendar in custom components.
 */
export interface Calendar {
  /**
   * All the days displayed in the calendar. As opposite from
   * {@link CalendarContext.dates}, it may return duplicated dates when shown
   * outside the month.
   */
  days: CalendarDay[];
  /**
   * Navigate to the specified date. If the second parameter (refDate) is
   * provided and the date is before the refDate, then the month is set to one
   * month before the date.
   *
   * @param day - The date to navigate to.
   * @param dateToCompare - Optional. If `date` is before `dateToCompare`, the
   *   month is set to one month before the date.
   */
  goToDay: (day: CalendarDay) => void;
  /** Navigate to the specified month. Will fire the `onMonthChange` callback. */
  goToMonth: (month: Date) => void;

  /** The months displayed in the calendar. */
  months: CalendarMonth[];
  /**
   * The month where the navigation ends. `undefined` if the calendar can be
   * navigated indefinitely to the past.
   */
  navEnd: Date | undefined;

  /**
   * The month where the navigation starts. `undefined` if the calendar can be
   * navigated indefinitely to the past.
   */
  navStart: Date | undefined;
  /** The next month to display. */
  nextMonth: Date | undefined;

  /** The previous month to display. */
  previousMonth: Date | undefined;
  /** The months displayed in the calendar. */
  weeks: CalendarWeek[];
}

export function useCalendar(
  props: Pick<
    DayPickerProps,
    | 'captionLayout'
    | 'endMonth'
    | 'startMonth'
    | 'today'
    | 'fixedWeeks'
    | 'ISOWeek'
    | 'numberOfMonths'
    | 'disableNavigation'
    | 'onMonthChange'
    | 'month'
    | 'defaultMonth'
    | 'timeZone'
    // Deprecated:
    | 'fromMonth'
    | 'fromYear'
    | 'toMonth'
    | 'toYear'
  >,
  dateLib: DateLib,
): Calendar {
  const [navStart, navEnd] = getNavMonths(props, dateLib);

  const { startOfMonth, endOfMonth } = dateLib;
  const initialMonth = getInitialMonth(props, dateLib);
  const [firstMonth, setFirstMonth] = useControlledValue(
    initialMonth,
    props.month ? startOfMonth(props.month) : undefined,
  );

  useEffect(() => {
    const newInitialMonth = getInitialMonth(props, dateLib);

    setFirstMonth(newInitialMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.timeZone]);

  /** The months displayed in the calendar. */
  const displayMonths = getDisplayMonths(firstMonth, navEnd, props, dateLib);

  /** The dates displayed in the calendar. */
  const dates = getDates(displayMonths, props.endMonth ? endOfMonth(props.endMonth) : undefined, props, dateLib);

  /** The Months displayed in the calendar. */
  const months = getMonths(displayMonths, dates, props, dateLib);

  /** The Weeks displayed in the calendar. */
  const weeks = getWeeks(months);

  /** The Days displayed in the calendar. */
  const days = getDays(months);

  const previousMonth = getPreviousMonth(firstMonth, navStart, props, dateLib);
  const nextMonth = getNextMonth(firstMonth, navEnd, props, dateLib);

  const { disableNavigation, onMonthChange } = props;

  const isDayInCalendar = (day: CalendarDay): boolean =>
    weeks.some((week: CalendarWeek) => week.days.some((d) => d.isEqualTo(day)));

  const goToMonth = (date: Date): void => {
    if (disableNavigation) {
      return;
    }

    let newMonth = startOfMonth(date);

    // if month is before start, use the first month instead
    if (navStart && newMonth < startOfMonth(navStart)) {
      newMonth = startOfMonth(navStart);
    }

    // if month is after endMonth, use the last month instead
    if (navEnd && newMonth > startOfMonth(navEnd)) {
      newMonth = startOfMonth(navEnd);
    }

    setFirstMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToDay = (day: CalendarDay): void => {
    // is this check necessary?
    if (isDayInCalendar(day)) {
      return;
    }

    goToMonth(day.date);
  };

  const calendar = {
    months,
    weeks,
    days,

    navStart,
    navEnd,

    previousMonth,
    nextMonth,

    goToMonth,
    goToDay,
  };

  return calendar;
}