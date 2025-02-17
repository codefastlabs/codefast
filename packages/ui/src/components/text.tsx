import type { HTMLAttributes, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Text
 * -------------------------------------------------------------------------- */

interface TextParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
  as?: 'p';
}

interface TextSpanProps extends HTMLAttributes<HTMLSpanElement> {
  as: 'span';
}

type TextProps = (TextParagraphProps | TextSpanProps) & {
  asChild?: boolean;
};

function Text({ as: Tag = 'p', asChild, ...props }: TextProps): JSX.Element {
  const Component = asChild ? Slot : Tag;

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { TextProps };
export { Text };
