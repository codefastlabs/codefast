import { type ComponentProps, type JSX } from 'react';

export type DropdownNavProps = ComponentProps<'div'>;

/**
 * Render the navigation dropdowns.
 */
export function DropdownNav(props: DropdownNavProps): JSX.Element {
  return <div {...props} />;
}
