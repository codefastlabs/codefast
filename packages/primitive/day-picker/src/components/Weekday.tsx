import { type ComponentProps, type JSX } from 'react';

export type WeekdayProps = ComponentProps<'th'>;

/**
 * Render the column header with the weekday name (e.g. "Mo", "Tu", etc.).
 *
 */
export function Weekday(props: WeekdayProps): JSX.Element {
  return <th {...props} />;
}
