import { type ComponentProps, type JSX } from 'react';

import { type CalendarMonth } from '@/lib/classes';

export type MonthCaptionProps = ComponentProps<'div'> & {
  /** The month where the grid is displayed. */
  calendarMonth: CalendarMonth;
  /** The index where this month is displayed. */
  displayIndex: number;
};

/**
 * Render the caption of a month in the calendar.
 */
export function MonthCaption({
  calendarMonth: _calendarMonth,
  displayIndex: _displayIndex,
  ...props
}: MonthCaptionProps): JSX.Element {
  return <div {...props} />;
}
