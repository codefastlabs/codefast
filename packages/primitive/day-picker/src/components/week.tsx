import { type ComponentProps, type JSX } from 'react';

import { type CalendarWeek } from '@/lib/classes';

export type WeekProps = ComponentProps<'tr'> & {
  week: CalendarWeek;
};

/**
 * Render a row in the calendar, with the days and the week number.
 */
export function Week({ week: _week, ...props }: WeekProps): JSX.Element {
  return <tr {...props} />;
}
