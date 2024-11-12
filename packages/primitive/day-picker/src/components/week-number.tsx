import { type ComponentProps, type JSX } from 'react';

import type { CalendarWeek } from '@/classes';

export type WeekNumberProps = ComponentProps<'th'> & {
  /** The week to render. */
  week: CalendarWeek;
};

/**
 * Render the cell with the number of the week.
 *
 */
export function WeekNumber(props: WeekNumberProps): JSX.Element {
  const { week: _week, ...thProps } = props;

  return <th {...thProps} />;
}
