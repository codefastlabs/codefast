import type { HTMLAttributes } from 'react';

import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Text
 * -------------------------------------------------------------------------- */

type TextElement = HTMLParagraphElement;
interface TextParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
  as?: 'p';
}

interface TextSpanProps extends HTMLAttributes<HTMLSpanElement> {
  as: 'span';
}

type TextProps = (TextParagraphProps | TextSpanProps) & {
  asChild?: boolean;
};

const Text = forwardRef<TextElement, TextProps>(({ as: Tag = 'p', asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : Tag;

  return <Component ref={forwardedRef} {...props} />;
});

Text.displayName = 'Text';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { TextProps };
export { Text };
