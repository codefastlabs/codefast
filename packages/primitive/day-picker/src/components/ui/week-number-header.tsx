import type { ComponentProps, JSX } from 'react';

export type WeekNumberHeaderProps = ComponentProps<'th'>;

/**
 * Render the column header for the week numbers.
 */
export function WeekNumberHeader(props: WeekNumberHeaderProps): JSX.Element {
  return <th {...props} />;
}
