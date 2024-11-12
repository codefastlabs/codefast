import { type ComponentProps, type JSX } from 'react';

import { useDayPicker } from '@/hooks/use-day-picker';

export type NextMonthButtonProps = ComponentProps<'button'>;

/**
 * Render the next month button element in the calendar.
 */
export function NextMonthButton(props: NextMonthButtonProps): JSX.Element {
  const { components } = useDayPicker();

  return <components.Button {...props} />;
}
