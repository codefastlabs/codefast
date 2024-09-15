'use client';

import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { separatorVariants, type SeparatorVariantsProps } from '@/styles/separator-variants';

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

const { root, item } = separatorVariants();

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

type SeparatorElement = React.ElementRef<typeof SeparatorPrimitive.Root>;

interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    Omit<SeparatorVariantsProps, 'orientation'> {}

const Separator = React.forwardRef<SeparatorElement, SeparatorProps>(
  ({ className, orientation, align, decorative = true, ...props }, forwardedRef) => (
    <SeparatorPrimitive.Root
      ref={forwardedRef}
      className={root({ align, orientation, className })}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  ),
);

Separator.displayName = SeparatorPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: SeparatorItem
 * -------------------------------------------------------------------------- */

type SeparatorItemElement = HTMLDivElement;
type SeparatorItemProps = React.HTMLAttributes<HTMLDivElement>;

const SeparatorItem = React.forwardRef<SeparatorItemElement, SeparatorItemProps>(
  ({ className, ...props }, forwardedRef) => <div ref={forwardedRef} className={item({ className })} {...props} />,
);

SeparatorItem.displayName = 'SeparatorItem';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Separator, SeparatorItem, type SeparatorProps };
