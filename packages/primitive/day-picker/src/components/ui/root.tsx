import type { ComponentProps, JSX } from 'react';

export type RootProps = ComponentProps<'div'>;

/**
 * Render the root element.
 */
export function Root(props: RootProps): JSX.Element {
  return <div {...props} />;
}
