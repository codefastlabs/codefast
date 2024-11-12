import { type ComponentProps, type JSX, useEffect, useRef } from 'react';

import { type CalendarDay } from '@/classes';
import { type Modifiers } from '@/types';

export type DayButtonProps = ComponentProps<'button'> & {
  /** The day to render. */
  day: CalendarDay;
  /** The modifiers for the day. */
  modifiers: Modifiers;
};

/**
 * Render the button for a day in the calendar.
 */
export function DayButton({ day: _day, modifiers, ...props }: DayButtonProps): JSX.Element {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return <button ref={ref} type="button" {...props} />;
}
