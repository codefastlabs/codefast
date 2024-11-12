import { type ComponentProps, type JSX } from 'react';

export type WeekdaysProps = ComponentProps<'tr'>;

/**
 * Render the row with the weekday names.
 *
 */
export function Weekdays(props: WeekdaysProps): JSX.Element {
  return (
    <thead>
      <tr {...props} />
    </thead>
  );
}
