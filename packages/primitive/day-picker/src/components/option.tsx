import { type ComponentProps, type JSX } from 'react';

export type OptionProps = ComponentProps<'option'>;

/**
 * Render the `option` element.
 */
export function Option(props: OptionProps): JSX.Element {
  return <option {...props} />;
}
