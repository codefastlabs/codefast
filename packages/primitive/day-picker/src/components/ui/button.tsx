import { type ComponentProps, type JSX } from 'react';

export type ButtonProps = ComponentProps<'button'>;

/**
 * Render the button elements in the calendar.
 *
 * @deprecated Use `PreviousMonthButton` or `@link NextMonthButton` instead.
 */
export function Button(props: ButtonProps): JSX.Element {
  return <button type="button" {...props} />;
}
