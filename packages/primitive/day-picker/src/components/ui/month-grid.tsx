import { type ComponentProps, type JSX } from 'react';

export type MonthGridProps = ComponentProps<'table'>;

/**
 * Render the grid of days in a month.
 */
export function MonthGrid(props: MonthGridProps): JSX.Element {
  return <table {...props} />;
}
