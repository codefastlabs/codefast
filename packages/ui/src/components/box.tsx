import { Slot } from '@radix-ui/react-slot';
import { type HTMLAttributes, forwardRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Box
 * -------------------------------------------------------------------------- */

type BoxElement = HTMLDivElement;
interface BoxDivProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div';
}

interface BoxSpanProps extends HTMLAttributes<HTMLSpanElement> {
  as: 'span';
}

type BoxProps = (BoxDivProps | BoxSpanProps) & {
  asChild?: boolean;
};

const Box = forwardRef<BoxElement, BoxProps>(({ as: Tag = 'div', asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : Tag;

  return <Component ref={forwardedRef} {...props} />;
});

Box.displayName = 'Box';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Box, type BoxProps };
