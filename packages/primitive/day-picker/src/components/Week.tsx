import { type ComponentProps, type JSX } from 'react';

import { type CalendarWeek } from '@/classes';

export type WeekProps = ComponentProps<'tr'> & {
  week: CalendarWeek;
};

/**
 * Render a row in the calendar, with the days and the week number.
 */
export function Week(props: WeekProps): JSX.Element {
  const { week: _week, ...trProps } = props;

  return <tr {...trProps} />;
}
