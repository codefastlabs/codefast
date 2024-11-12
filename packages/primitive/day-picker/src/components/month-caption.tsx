import { type ComponentProps, type JSX } from 'react';

import { type CalendarMonth } from '@/classes';

export type MonthCaptionProps = ComponentProps<'div'> & {
  /** The month where the grid is displayed. */
  calendarMonth: CalendarMonth;
  /** The index where this month is displayed. */
  displayIndex: number;
};

/**
 * Render the caption of a month in the calendar.
 */
export function MonthCaption(props: MonthCaptionProps): JSX.Element {
  const { calendarMonth, displayIndex, ...divProps } = props;

  return <div {...divProps} />;
}
