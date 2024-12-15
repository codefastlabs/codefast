import type { ComponentProps, JSX } from 'react';

export type PreviousMonthButtonProps = ComponentProps<'button'>;

/**
 * Render the previous month button element in the calendar.
 */
export function PreviousMonthButton(props: PreviousMonthButtonProps): JSX.Element {
  return <button type="button" {...props} />;
}
