import { type ComponentProps, type JSX } from 'react';

import { useDayPicker } from '@/use-day-picker';

export type PreviousMonthButtonProps = ComponentProps<'button'>;

/**
 * Render the previous month button element in the calendar.
 *
 */
export function PreviousMonthButton(props: PreviousMonthButtonProps): JSX.Element {
  const { components } = useDayPicker();

  return <components.Button {...props} />;
}