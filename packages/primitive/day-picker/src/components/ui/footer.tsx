import type { ComponentProps, JSX } from 'react';

export type FooterProps = ComponentProps<'div'>;

/**
 * Component wrapping the footer.
 */
export function Footer(props: FooterProps): JSX.Element {
  return <div {...props} />;
}
