import { type ComponentProps, type JSX } from 'react';

export type MonthsProps = ComponentProps<'div'>;

/**
 * Component wrapping the month grids.
 */
export function Months(props: MonthsProps): JSX.Element {
  return <div {...props} />;
}
