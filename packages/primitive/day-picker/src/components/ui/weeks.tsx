import type { ComponentProps, JSX } from 'react';

export type WeeksProps = ComponentProps<'tbody'>;

/**
 * Render the weeks in the month grid.
 */
export function Weeks(props: WeeksProps): JSX.Element {
  return <tbody {...props} />;
}
