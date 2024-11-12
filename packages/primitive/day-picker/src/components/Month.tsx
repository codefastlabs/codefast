import { type ComponentProps, type JSX } from 'react';

import { type CalendarMonth } from '@/classes/calendar-month';

export type MonthProps = ComponentProps<'div'> & {
  /** The month where the grid is displayed. */
  calendarMonth: CalendarMonth;
  /** The index where this month is displayed. */
  displayIndex: number;
};

/**
 * Render the grid with the weekday header row and the weeks for the given
 * month.
 */
export function Month(props: MonthProps): JSX.Element {
  const { calendarMonth, displayIndex, ...divProps } = props;

  return <div {...divProps}>{props.children}</div>;
}
