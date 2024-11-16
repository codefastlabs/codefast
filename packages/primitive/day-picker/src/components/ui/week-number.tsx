import { type ComponentProps, type JSX } from 'react';

import { type CalendarWeek } from '@/lib/classes';

export type WeekNumberProps = ComponentProps<'th'> & {
  /**
   * The week to render.
   */
  week: CalendarWeek;
};

/**
 * Render the cell with the number of the week.
 */
export function WeekNumber({ week: _week, ...props }: WeekNumberProps): JSX.Element {
  return <th {...props} />;
}
