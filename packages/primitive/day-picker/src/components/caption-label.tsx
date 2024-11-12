import { type ComponentProps, type JSX } from 'react';

export type CaptionLabelProps = ComponentProps<'span'>;

/**
 * Render the label in the month caption.
 *
 */
export function CaptionLabel(props: CaptionLabelProps): JSX.Element {
  return <span {...props} />;
}
