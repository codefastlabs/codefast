import { type ComponentProps, type JSX } from 'react';

import { type CalendarDay } from '@/lib/classes';
import { type Modifiers } from '@/lib/types';

export type DayProps = ComponentProps<'td'> & {
  /** The day to render. */
  day: CalendarDay;
  /** The modifiers to apply to the day. */
  modifiers: Modifiers;
};

/**
 * Render the grid-cell of a day in the calendar and handle the interaction and
 * the focus with they day.
 *
 * If you need to just change the content of the day cell, consider swapping the
 * `DayDate` component instead.
 */
export function Day({ day: _day, modifiers: _modifiers, ...props }: DayProps): JSX.Element {
  return <td {...props} />;
}