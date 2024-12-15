import type { ComponentProps, JSX } from 'react';

import type { CalendarMonth } from '@/lib/classes/calendar-month';

export type MonthProps = ComponentProps<'div'> & {
  /**
   * The month where the grid is displayed.
   */
  calendarMonth: CalendarMonth;

  /**
   * The index where this month is displayed.
   */
  displayIndex: number;
};

/**
 * Render the grid with the weekday header row and the weeks for the given
 * month.
 */
export function Month({
  calendarMonth: _calendarMonth,
  children,
  displayIndex: _displayIndex,
  ...props
}: MonthProps): JSX.Element {
  return <div {...props}>{children}</div>;
}
