import { type ComponentProps, type JSX } from 'react';

export type NextMonthButtonProps = ComponentProps<'button'>;

/**
 * Render the next month button element in the calendar.
 */
export function NextMonthButton(props: NextMonthButtonProps): JSX.Element {
  return <button type="button" {...props} />;
}
