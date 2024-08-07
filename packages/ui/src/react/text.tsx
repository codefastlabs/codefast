import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Text
 * -------------------------------------------------------------------------- */

type TextElement = HTMLParagraphElement;

interface TextParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: 'p';
}

interface TextSpanProps extends React.HTMLAttributes<HTMLSpanElement> {
  as: 'span';
}

type TextProps = (TextParagraphProps | TextSpanProps) & {
  asChild?: boolean;
};

const Text = React.forwardRef<TextElement, TextProps>(({ as: Tag = 'p', asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : Tag;

  return <Component ref={forwardedRef} {...props} />;
});

Text.displayName = 'Text';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Text, type TextProps };
