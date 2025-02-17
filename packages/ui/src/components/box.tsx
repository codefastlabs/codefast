import type { HTMLAttributes, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Box
 * -------------------------------------------------------------------------- */

interface BoxDivProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div';
}

interface BoxSpanProps extends HTMLAttributes<HTMLSpanElement> {
  as: 'span';
}

type BoxProps = (BoxDivProps | BoxSpanProps) & {
  asChild?: boolean;
};

function Box({ as: Tag = 'div', asChild, ...props }: BoxProps): JSX.Element {
  const Component = asChild ? Slot : Tag;

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { BoxProps };
export { Box };
