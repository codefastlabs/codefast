import type { ComponentProps, JSX } from 'react';

export type SelectProps = ComponentProps<'select'>;

/**
 * Render the `select` element.
 */
export function Select(props: SelectProps): JSX.Element {
  return <select {...props} />;
}
